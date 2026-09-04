-- Stage 8 A1: persist treasury/budget workflow state before an owner links
-- that workspace to its own verified Sui Treasury. Existing linked rows and
-- every approved/payment snapshot remain unchanged.

alter table public.treasuries
  alter column sui_treasury_object_id drop not null;

alter table public.claims
  alter column treasury_object_id drop not null;

alter table public.treasuries
  add column join_code text;

update public.treasuries
set join_code = upper(substr(regexp_replace(external_reference, '[^a-zA-Z0-9]', '', 'g') || md5(id::text), 1, 4))
  || '-'
  || upper(substr(md5(id::text), 1, 6))
where join_code is null;

alter table public.treasuries
  alter column join_code set not null;

alter table public.treasuries
  add constraint treasuries_join_code_unique unique (join_code);

alter table public.treasuries
  add constraint treasuries_join_code_check
  check (join_code ~ '^[A-Z0-9]{4}-[A-Z0-9]{6}$');

alter table public.treasuries
  drop constraint treasuries_object_id_check;

alter table public.treasuries
  add constraint treasuries_object_id_check
  check (
    sui_treasury_object_id is null
    or sui_treasury_object_id ~ '^0x[0-9a-f]{64}$'
  );

alter table public.claims
  drop constraint claims_treasury_object_id_check;

alter table public.claims
  add constraint claims_treasury_object_id_check
  check (
    treasury_object_id is null
    or treasury_object_id ~ '^0x[0-9a-f]{64}$'
  );

create or replace function public.replace_treasury_budget(
  p_treasury_id uuid,
  p_categories jsonb
)
returns setof public.budget_categories
language plpgsql
security definer
set search_path = ''
as $$
declare
  treasury_total bigint;
  allocation_total numeric;
begin
  if public.current_wallet_user_id() is null then
    raise exception 'Authentication required';
  end if;

  if not public.can_manage_treasury(p_treasury_id) then
    raise exception 'Treasurer role required';
  end if;

  select treasury.total_budget_minor into treasury_total
  from public.treasuries treasury
  where treasury.id = p_treasury_id
    and treasury.status = 'active'
  for update;

  if treasury_total is null then
    raise exception 'Active treasury not found';
  end if;

  if exists (
    select 1
    from public.claims claim
    where claim.treasury_id = p_treasury_id
  ) then
    raise exception 'Budget categories cannot be replaced after claims exist';
  end if;

  if p_categories is null
    or jsonb_typeof(p_categories) <> 'array'
    or jsonb_array_length(p_categories) = 0
  then
    raise exception 'At least one budget category is required';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_categories) item
    where jsonb_typeof(item) <> 'object'
      or not (item ? 'name')
      or not (item ? 'allocated_minor')
      or char_length(btrim(item ->> 'name')) not between 1 and 80
      or (item ->> 'allocated_minor') !~ '^[0-9]+$'
      or (item ->> 'allocated_minor')::numeric <= 0
      or (item ->> 'allocated_minor')::numeric > 9007199254740991
      or (item ->> 'allocated_minor')::numeric <> trunc((item ->> 'allocated_minor')::numeric)
  ) then
    raise exception 'Budget categories require a valid name and positive integer allocation';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_categories) item
    group by lower(btrim(item ->> 'name'))
    having count(*) > 1
  ) then
    raise exception 'Budget category names must be unique';
  end if;

  select sum((item ->> 'allocated_minor')::numeric) into allocation_total
  from jsonb_array_elements(p_categories) item;

  if allocation_total <> treasury_total then
    raise exception 'Budget categories must sum exactly to the treasury total';
  end if;

  delete from public.budget_categories category
  where category.treasury_id = p_treasury_id;

  insert into public.budget_categories (
    treasury_id,
    external_reference,
    name,
    allocated_minor,
    spent_minor
  )
  select
    p_treasury_id,
    coalesce(
      nullif(lower(regexp_replace(btrim(item ->> 'name'), '[^a-zA-Z0-9]+', '-', 'g')), ''),
      'category'
    ) || '-' || lpad(ordinality::text, 2, '0'),
    btrim(item ->> 'name'),
    (item ->> 'allocated_minor')::bigint,
    0
  from jsonb_array_elements(p_categories) with ordinality as input(item, ordinality);

  return query
  select category.*
  from public.budget_categories category
  where category.treasury_id = p_treasury_id
  order by category.created_at, category.id;
end;
$$;

revoke all on function public.replace_treasury_budget(uuid, jsonb) from public;
revoke all on function public.replace_treasury_budget(uuid, jsonb) from anon;
grant execute on function public.replace_treasury_budget(uuid, jsonb) to authenticated;

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
  treasury_object_id text;
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

  if not public.can_manage_treasury(claim_row.treasury_id) then
    raise exception 'Treasurer role required';
  end if;

  select
    category.external_reference,
    treasury.sui_treasury_object_id
  into category_reference, treasury_object_id
  from public.budget_categories category
  join public.treasuries treasury on treasury.id = category.treasury_id
  where category.id = claim_row.category_id
    and category.treasury_id = claim_row.treasury_id;

  if p_decision = 'approve' then
    if treasury_object_id is null then
      raise exception 'Link this treasury to Sui before approval';
    end if;

    if claim_row.treasury_object_id is not null
      and claim_row.treasury_object_id is distinct from treasury_object_id
    then
      raise exception 'Claim treasury does not match the linked Sui Treasury';
    end if;

    update public.claims
    set status = 'approved_unpaid',
        decision = p_decision,
        decision_reason = btrim(p_reason),
        decided_by = actor,
        decided_at = now(),
        payment_status = 'unpaid',
        treasury_object_id = treasury_object_id,
        approved_treasury_object_id = treasury_object_id,
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
  treasury_object_id text;
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

  select treasury.sui_treasury_object_id into treasury_object_id
  from public.treasuries treasury
  where treasury.id = claim_row.treasury_id;

  if treasury_object_id is null
    or claim_row.approved_treasury_object_id is distinct from treasury_object_id
  then
    raise exception 'Approved claim does not match a linked Sui Treasury';
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
