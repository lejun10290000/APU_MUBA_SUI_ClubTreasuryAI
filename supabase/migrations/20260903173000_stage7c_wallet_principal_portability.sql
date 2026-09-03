-- Stage 7C: make a verified Sui wallet the durable authorization principal
-- across fresh anonymous Supabase browser sessions. The raw auth.uid() remains
-- the session shell; a consumed wallet challenge resolves it to the existing
-- canonical wallet_profiles.user_id. RLS and all payout invariants remain in
-- force.

create or replace function public.current_wallet_user_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select profile.user_id
      from public.wallet_nonces nonce
      join public.wallet_profiles profile
        on profile.wallet_address = nonce.wallet_address
      where nonce.user_id = auth.uid()
        and nonce.consumed_at is not null
      order by nonce.consumed_at desc
      limit 1
    ),
    auth.uid()
  );
$$;

revoke all on function public.current_wallet_user_id() from public;
revoke all on function public.current_wallet_user_id() from anon;
grant execute on function public.current_wallet_user_id() to authenticated;

create or replace function public.can_access_treasury(p_treasury_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.treasuries treasury
    where treasury.id = p_treasury_id
      and treasury.owner_user_id = public.current_wallet_user_id()
  ) or exists (
    select 1 from public.treasury_members member
    where member.treasury_id = p_treasury_id
      and member.user_id = public.current_wallet_user_id()
  );
$$;

create or replace function public.can_manage_treasury(p_treasury_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.treasuries treasury
    where treasury.id = p_treasury_id
      and treasury.owner_user_id = public.current_wallet_user_id()
  ) or exists (
    select 1 from public.treasury_members member
    where member.treasury_id = p_treasury_id
      and member.user_id = public.current_wallet_user_id()
      and member.role in ('owner', 'treasurer')
  );
$$;

revoke all on function public.can_access_treasury(uuid) from public;
revoke all on function public.can_manage_treasury(uuid) from public;
revoke all on function public.can_access_treasury(uuid) from anon;
revoke all on function public.can_manage_treasury(uuid) from anon;
grant execute on function public.can_access_treasury(uuid) to authenticated;
grant execute on function public.can_manage_treasury(uuid) to authenticated;

-- Policies that previously compared durable business rows directly with the
-- ephemeral auth.uid() now compare against the verified canonical wallet user.
drop policy if exists "wallet owners read their verified profile" on public.wallet_profiles;
create policy "wallet owners read their verified profile"
on public.wallet_profiles for select
to authenticated
using (user_id = public.current_wallet_user_id());

drop policy if exists "verified wallet owners create treasuries" on public.treasuries;
create policy "verified wallet owners create treasuries"
on public.treasuries for insert
to authenticated
with check (
  owner_user_id = public.current_wallet_user_id()
  and exists (
    select 1 from public.wallet_profiles profile
    where profile.user_id = public.current_wallet_user_id()
  )
);

drop policy if exists "owners update their treasuries" on public.treasuries;
create policy "owners update their treasuries"
on public.treasuries for update
to authenticated
using (owner_user_id = public.current_wallet_user_id())
with check (owner_user_id = public.current_wallet_user_id());

drop policy if exists "members read their membership and owners read their roster" on public.treasury_members;
create policy "members read their membership and owners read their roster"
on public.treasury_members for select
to authenticated
using (
  user_id = public.current_wallet_user_id()
  or public.can_manage_treasury(treasury_id)
);

drop policy if exists "claim participants read claims" on public.claims;
create policy "claim participants read claims"
on public.claims for select
to authenticated
using (
  member_user_id = public.current_wallet_user_id()
  or public.can_manage_treasury(treasury_id)
);

drop policy if exists "verified members submit their own claims" on public.claims;
create policy "verified members submit their own claims"
on public.claims for insert
to authenticated
with check (
  member_user_id = public.current_wallet_user_id()
  and member_wallet_address = (
    select profile.wallet_address
    from public.wallet_profiles profile
    where profile.user_id = public.current_wallet_user_id()
  )
  and split_part(receipt_path, '/', 1) = public.current_wallet_user_id()::text
  and public.can_access_treasury(treasury_id)
);

drop policy if exists "members upload immutable receipt evidence" on storage.objects;
create policy "members upload immutable receipt evidence"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = public.current_wallet_user_id()::text
);

-- Human claim decisions preserve the canonical treasurer identity in decided_by.
create or replace function public.decide_claim(
  p_claim_id uuid,
  p_decision public.claim_decision,
  p_reason text
)
returns public.claims
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := public.current_wallet_user_id();
  claim_row public.claims;
  category_reference text;
begin
  if actor is null then
    raise exception 'Authentication required';
  end if;

  if p_reason is null or char_length(btrim(p_reason)) not between 1 and 240 then
    raise exception 'Decision reason must contain 1 to 240 characters';
  end if;

  select claim.* into claim_row
  from public.claims claim
  where claim.id = p_claim_id
  for update;

  if claim_row.id is null then
    raise exception 'Claim not found';
  end if;

  if claim_row.status <> 'under_review' then
    raise exception 'Only under-review claims can be decided';
  end if;

  if not exists (
    select 1 from public.treasuries treasury
    where treasury.id = claim_row.treasury_id
      and treasury.owner_user_id = actor
  ) and not exists (
    select 1 from public.treasury_members member
    where member.treasury_id = claim_row.treasury_id
      and member.user_id = actor
      and member.role in ('owner', 'treasurer')
  ) then
    raise exception 'Treasurer role required';
  end if;

  select category.external_reference into category_reference
  from public.budget_categories category
  where category.id = claim_row.category_id
    and category.treasury_id = claim_row.treasury_id;

  if p_decision = 'approve' then
    update public.claims
    set status = 'approved_unpaid',
        decision = p_decision,
        decision_reason = btrim(p_reason),
        decided_by = actor,
        decided_at = now(),
        payment_status = 'unpaid',
        approved_treasury_object_id = claim_row.treasury_object_id,
        approved_category_reference = category_reference,
        approved_recipient_sui_address = claim_row.recipient_sui_address,
        approved_amount_minor = claim_row.requested_amount_minor,
        approved_currency = claim_row.currency
    where id = p_claim_id
    returning * into claim_row;
  else
    update public.claims
    set status = 'rejected',
        decision = p_decision,
        decision_reason = btrim(p_reason),
        decided_by = actor,
        decided_at = now(),
        payment_status = 'unpaid'
    where id = p_claim_id
    returning * into claim_row;
  end if;

  return claim_row;
end;
$$;

revoke all on function public.decide_claim(uuid, public.claim_decision, text) from public;
revoke all on function public.decide_claim(uuid, public.claim_decision, text) from anon;
grant execute on function public.decide_claim(uuid, public.claim_decision, text) to authenticated;

-- Payment preparation also records the canonical treasurer identity while the
-- rest of the Stage 6 state machine and finality checks remain unchanged.
create or replace function public.prepare_claim_payment(p_claim_id uuid)
returns public.claim_payment_attempts
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := public.current_wallet_user_id();
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

revoke all on function public.prepare_claim_payment(uuid) from public;
revoke all on function public.prepare_claim_payment(uuid) from anon;
grant execute on function public.prepare_claim_payment(uuid) to authenticated;
