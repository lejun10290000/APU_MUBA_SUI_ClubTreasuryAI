-- Stage 6: approved claim -> recoverable Sui Testnet payout persistence.
-- Network calls and wallet signing remain outside database transactions.

alter type public.claim_status add value if not exists 'paid';

alter table public.claims
  drop constraint if exists claims_payment_status_check,
  drop constraint if exists claims_recommendation_state_check,
  drop constraint if exists claims_decision_state_check,
  drop constraint if exists claims_approved_snapshot_check;

alter table public.claims
  add column confirmed_transaction_digest text,
  add column paid_at timestamptz;

alter table public.claims
  add constraint claims_payment_status_check
    check (payment_status in ('unpaid', 'paid')),
  add constraint claims_confirmed_digest_check
    check (
      confirmed_transaction_digest is null
      or char_length(btrim(confirmed_transaction_digest)) between 20 and 200
    ),
  add constraint claims_recommendation_state_check check (
    (status = 'submitted' and recommendation is null and recommendation_at is null)
    or
    (status <> 'submitted' and recommendation is not null and recommendation_at is not null)
  ),
  add constraint claims_decision_state_check check (
    (
      status in ('submitted', 'under_review')
      and decision is null
      and decision_reason is null
      and decided_by is null
      and decided_at is null
    )
    or
    (
      status = 'rejected'
      and decision = 'reject'
      and decision_reason is not null
      and decided_by is not null
      and decided_at is not null
    )
    or
    (
      status in ('approved_unpaid', 'paid')
      and decision = 'approve'
      and decision_reason is not null
      and decided_by is not null
      and decided_at is not null
    )
  ),
  add constraint claims_approved_snapshot_check check (
    (
      status in ('approved_unpaid', 'paid')
      and approved_treasury_object_id is not null
      and approved_category_reference is not null
      and approved_recipient_sui_address is not null
      and approved_amount_minor is not null
      and approved_currency = 'USDC'
    )
    or
    (
      status not in ('approved_unpaid', 'paid')
      and approved_treasury_object_id is null
      and approved_category_reference is null
      and approved_recipient_sui_address is null
      and approved_amount_minor is null
      and approved_currency is null
    )
  ),
  add constraint claims_payment_terminal_state_check check (
    (
      status = 'paid'
      and payment_status = 'paid'
      and confirmed_transaction_digest is not null
      and paid_at is not null
    )
    or
    (
      status <> 'paid'
      and payment_status = 'unpaid'
      and confirmed_transaction_digest is null
      and paid_at is null
    )
  );

create table public.claim_payment_attempts (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  treasury_id uuid not null references public.treasuries(id) on delete cascade,
  category_id uuid not null,
  initiated_by uuid not null references public.wallet_profiles(user_id),
  treasurer_cap_object_id text,
  expected_treasury_object_id text not null,
  expected_category_reference text not null,
  expected_recipient_sui_address text not null,
  expected_amount_minor bigint not null,
  expected_currency text not null,
  transaction_digest text unique,
  status text not null default 'prepared',
  failure_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  constraint claim_payment_attempts_category_treasury_fk
    foreign key (category_id, treasury_id)
    references public.budget_categories(id, treasury_id),
  constraint claim_payment_attempts_cap_check
    check (
      treasurer_cap_object_id is null
      or treasurer_cap_object_id ~ '^0x[0-9a-f]{64}$'
    ),
  constraint claim_payment_attempts_treasury_object_check
    check (expected_treasury_object_id ~ '^0x[0-9a-f]{64}$'),
  constraint claim_payment_attempts_recipient_check
    check (expected_recipient_sui_address ~ '^0x[0-9a-f]{64}$'),
  constraint claim_payment_attempts_amount_check
    check (expected_amount_minor > 0),
  constraint claim_payment_attempts_currency_check
    check (expected_currency = 'USDC'),
  constraint claim_payment_attempts_digest_check
    check (
      transaction_digest is null
      or char_length(btrim(transaction_digest)) between 20 and 200
    ),
  constraint claim_payment_attempts_status_check check (
    status in (
      'prepared',
      'signed',
      'submitted',
      'confirmed',
      'cancelled',
      'failed',
      'reconciliation_required'
    )
  ),
  constraint claim_payment_attempts_state_evidence_check check (
    (
      status = 'prepared'
      and transaction_digest is null
      and confirmed_at is null
    )
    or
    (
      status in ('signed', 'submitted', 'reconciliation_required')
      and transaction_digest is not null
      and treasurer_cap_object_id is not null
      and confirmed_at is null
    )
    or
    (
      status = 'confirmed'
      and transaction_digest is not null
      and treasurer_cap_object_id is not null
      and confirmed_at is not null
    )
    or
    (
      status in ('cancelled', 'failed')
      and confirmed_at is null
    )
  )
);

create index claim_payment_attempts_claim_created_idx
  on public.claim_payment_attempts (claim_id, created_at desc);
create index claim_payment_attempts_treasury_created_idx
  on public.claim_payment_attempts (treasury_id, created_at desc);
create index claim_payment_attempts_initiated_by_idx
  on public.claim_payment_attempts (initiated_by);
create index claim_payment_attempts_category_treasury_idx
  on public.claim_payment_attempts (category_id, treasury_id);

create unique index claim_payment_attempts_one_active_per_claim_idx
  on public.claim_payment_attempts (claim_id)
  where status in ('prepared', 'signed', 'submitted', 'reconciliation_required');

create trigger claim_payment_attempts_set_updated_at
before update on public.claim_payment_attempts
for each row execute function public.set_updated_at();

alter table public.claim_payment_attempts enable row level security;

create policy "treasury managers read payment attempts"
on public.claim_payment_attempts for select
to authenticated
using (public.can_manage_treasury(treasury_id));

revoke all on table public.claim_payment_attempts from anon, authenticated;
grant select on public.claim_payment_attempts to authenticated;

create or replace function public.prepare_claim_payment(p_claim_id uuid)
returns public.claim_payment_attempts
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  claim_row public.claims;
  attempt_row public.claim_payment_attempts;
begin
  if actor is null then
    raise exception 'Authentication required';
  end if;

  select claim.* into claim_row
  from public.claims claim
  where claim.id = p_claim_id
  for update;

  if claim_row.id is null then
    raise exception 'Claim not found';
  end if;

  if not public.can_manage_treasury(claim_row.treasury_id) then
    raise exception 'Treasurer role required';
  end if;

  if claim_row.status = 'paid' and claim_row.payment_status = 'paid' then
    select attempt.* into attempt_row
    from public.claim_payment_attempts attempt
    where attempt.claim_id = claim_row.id
      and attempt.status = 'confirmed'
    order by attempt.confirmed_at desc
    limit 1;

    if attempt_row.id is null then
      raise exception 'Paid claim is missing confirmed payment evidence';
    end if;

    return attempt_row;
  end if;

  if claim_row.status <> 'approved_unpaid'
    or claim_row.decision <> 'approve'
    or claim_row.payment_status <> 'unpaid'
    or claim_row.approved_treasury_object_id is null
    or claim_row.approved_category_reference is null
    or claim_row.approved_recipient_sui_address is null
    or claim_row.approved_amount_minor is null
    or claim_row.approved_currency <> 'USDC'
  then
    raise exception 'Claim is not eligible for payment';
  end if;

  select attempt.* into attempt_row
  from public.claim_payment_attempts attempt
  where attempt.claim_id = claim_row.id
    and attempt.status in ('prepared', 'signed', 'submitted', 'reconciliation_required')
  order by attempt.created_at desc
  limit 1;

  if attempt_row.id is not null then
    return attempt_row;
  end if;

  insert into public.claim_payment_attempts (
    claim_id,
    treasury_id,
    category_id,
    initiated_by,
    expected_treasury_object_id,
    expected_category_reference,
    expected_recipient_sui_address,
    expected_amount_minor,
    expected_currency
  ) values (
    claim_row.id,
    claim_row.treasury_id,
    claim_row.category_id,
    actor,
    claim_row.approved_treasury_object_id,
    claim_row.approved_category_reference,
    claim_row.approved_recipient_sui_address,
    claim_row.approved_amount_minor,
    claim_row.approved_currency
  )
  returning * into attempt_row;

  return attempt_row;
end;
$$;

create or replace function public.transition_claim_payment_attempt(
  p_attempt_id uuid,
  p_status text,
  p_transaction_digest text default null,
  p_treasurer_cap_object_id text default null,
  p_failure_code text default null
)
returns public.claim_payment_attempts
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  attempt_row public.claim_payment_attempts;
begin
  if actor is null then
    raise exception 'Authentication required';
  end if;

  select attempt.* into attempt_row
  from public.claim_payment_attempts attempt
  where attempt.id = p_attempt_id
  for update;

  if attempt_row.id is null then
    raise exception 'Payment attempt not found';
  end if;

  if not public.can_manage_treasury(attempt_row.treasury_id) then
    raise exception 'Treasurer role required';
  end if;

  if p_status = 'signed' then
    if attempt_row.status <> 'prepared' then
      raise exception 'Only prepared attempts can become signed';
    end if;
    if p_transaction_digest is null or p_treasurer_cap_object_id is null then
      raise exception 'Signed attempt requires digest and TreasurerCap';
    end if;

    update public.claim_payment_attempts
    set status = 'signed',
        transaction_digest = btrim(p_transaction_digest),
        treasurer_cap_object_id = p_treasurer_cap_object_id,
        failure_code = null
    where id = p_attempt_id
    returning * into attempt_row;

  elsif p_status = 'submitted' then
    if attempt_row.status <> 'signed' or attempt_row.transaction_digest is null then
      raise exception 'Only signed attempts with a digest can become submitted';
    end if;

    update public.claim_payment_attempts
    set status = 'submitted', failure_code = null
    where id = p_attempt_id
    returning * into attempt_row;

  elsif p_status = 'reconciliation_required' then
    if attempt_row.status not in ('signed', 'submitted', 'reconciliation_required')
      or attempt_row.transaction_digest is null
    then
      raise exception 'Reconciliation requires an existing digest';
    end if;

    update public.claim_payment_attempts
    set status = 'reconciliation_required',
        failure_code = nullif(btrim(p_failure_code), '')
    where id = p_attempt_id
    returning * into attempt_row;

  elsif p_status = 'cancelled' then
    if attempt_row.status <> 'prepared' then
      raise exception 'Only prepared attempts can be cancelled';
    end if;

    update public.claim_payment_attempts
    set status = 'cancelled',
        failure_code = nullif(btrim(p_failure_code), '')
    where id = p_attempt_id
    returning * into attempt_row;

  elsif p_status = 'failed' then
    if attempt_row.status not in ('prepared', 'signed', 'submitted') then
      raise exception 'Attempt cannot transition to failed from its current state';
    end if;

    update public.claim_payment_attempts
    set status = 'failed',
        failure_code = nullif(btrim(p_failure_code), '')
    where id = p_attempt_id
    returning * into attempt_row;

  else
    raise exception 'Unsupported payment attempt transition';
  end if;

  return attempt_row;
end;
$$;

create or replace function public.finalize_claim_payment(
  p_attempt_id uuid,
  p_transaction_digest text,
  p_confirmed_category_remaining_minor bigint
)
returns public.claims
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  claim_row public.claims;
  attempt_row public.claim_payment_attempts;
  category_row public.budget_categories;
  expected_remaining bigint;
begin
  if actor is null then
    raise exception 'Authentication required';
  end if;

  select attempt.claim_id into claim_row.id
  from public.claim_payment_attempts attempt
  where attempt.id = p_attempt_id;

  if claim_row.id is null then
    raise exception 'Payment attempt not found';
  end if;

  select claim.* into claim_row
  from public.claims claim
  where claim.id = claim_row.id
  for update;

  select attempt.* into attempt_row
  from public.claim_payment_attempts attempt
  where attempt.id = p_attempt_id
  for update;

  if not public.can_manage_treasury(claim_row.treasury_id) then
    raise exception 'Treasurer role required';
  end if;

  if attempt_row.claim_id <> claim_row.id
    or attempt_row.treasury_id <> claim_row.treasury_id
    or attempt_row.category_id <> claim_row.category_id
  then
    raise exception 'Payment attempt does not match claim';
  end if;

  if attempt_row.transaction_digest is null
    or attempt_row.transaction_digest <> btrim(p_transaction_digest)
  then
    raise exception 'Confirmed digest does not match payment attempt';
  end if;

  if attempt_row.status = 'confirmed'
    and claim_row.status = 'paid'
    and claim_row.payment_status = 'paid'
    and claim_row.confirmed_transaction_digest = attempt_row.transaction_digest
  then
    return claim_row;
  end if;

  if attempt_row.status not in ('submitted', 'reconciliation_required') then
    raise exception 'Payment attempt is not ready for confirmation';
  end if;

  if claim_row.status <> 'approved_unpaid'
    or claim_row.decision <> 'approve'
    or claim_row.payment_status <> 'unpaid'
  then
    raise exception 'Claim is not eligible for finalization';
  end if;

  select category.* into category_row
  from public.budget_categories category
  where category.id = claim_row.category_id
    and category.treasury_id = claim_row.treasury_id
  for update;

  if category_row.id is null then
    raise exception 'Budget category not found';
  end if;

  if attempt_row.expected_treasury_object_id <> claim_row.approved_treasury_object_id
    or attempt_row.expected_category_reference <> claim_row.approved_category_reference
    or attempt_row.expected_recipient_sui_address <> claim_row.approved_recipient_sui_address
    or attempt_row.expected_amount_minor <> claim_row.approved_amount_minor
    or attempt_row.expected_currency <> claim_row.approved_currency
  then
    raise exception 'Approved payout snapshot mismatch';
  end if;

  expected_remaining := category_row.allocated_minor
    - category_row.spent_minor
    - attempt_row.expected_amount_minor;

  if expected_remaining < 0 then
    raise exception 'Payment exceeds remaining category budget';
  end if;

  if p_confirmed_category_remaining_minor <> expected_remaining then
    raise exception 'Confirmed category remaining does not match database budget state';
  end if;

  update public.budget_categories
  set spent_minor = allocated_minor - p_confirmed_category_remaining_minor
  where id = category_row.id;

  update public.claim_payment_attempts
  set status = 'confirmed',
      confirmed_at = now(),
      failure_code = null
  where id = attempt_row.id;

  update public.claims
  set status = 'paid',
      payment_status = 'paid',
      confirmed_transaction_digest = attempt_row.transaction_digest,
      paid_at = now()
  where id = claim_row.id
  returning * into claim_row;

  return claim_row;
end;
$$;

revoke all on function public.prepare_claim_payment(uuid) from public;
revoke all on function public.prepare_claim_payment(uuid) from anon;
grant execute on function public.prepare_claim_payment(uuid) to authenticated;

revoke all on function public.transition_claim_payment_attempt(uuid, text, text, text, text) from public;
revoke all on function public.transition_claim_payment_attempt(uuid, text, text, text, text) from anon;
grant execute on function public.transition_claim_payment_attempt(uuid, text, text, text, text) to authenticated;

revoke all on function public.finalize_claim_payment(uuid, text, bigint) from public;
revoke all on function public.finalize_claim_payment(uuid, text, bigint) from anon;
grant execute on function public.finalize_claim_payment(uuid, text, bigint) to authenticated;
