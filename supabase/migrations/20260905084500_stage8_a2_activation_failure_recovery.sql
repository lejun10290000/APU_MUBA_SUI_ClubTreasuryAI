-- Stage 8 A2 hardening: distinguish chain-proven failures from ambiguous outcomes.
-- A replacement activation transaction is permitted only after the saved digest
-- is verified on-chain as failed. Also align budget locking with the approved
-- rule: the budget locks when the first Create transaction is signed, not when
-- the activation wizard is merely opened.

alter table public.treasury_sui_activations
  drop constraint if exists treasury_sui_activations_create_status_check,
  drop constraint if exists treasury_sui_activations_fund_status_check,
  drop constraint if exists treasury_sui_activations_allocation_status_check;

alter table public.treasury_sui_activations
  add constraint treasury_sui_activations_create_status_check
    check (create_status in ('not_started','signed','submitted','confirmed','reconciliation_required','failed','failed_before_signing')),
  add constraint treasury_sui_activations_fund_status_check
    check (fund_status in ('not_started','signed','submitted','confirmed','reconciliation_required','failed','failed_before_signing')),
  add constraint treasury_sui_activations_allocation_status_check
    check (allocation_status in ('not_started','signed','submitted','confirmed','reconciliation_required','failed','failed_before_signing'));

create or replace function public.start_treasury_sui_activation(
  p_treasury_id uuid,
  p_owner_user_id uuid,
  p_owner_wallet_address text
)
returns public.treasury_sui_activations
language plpgsql
security definer
set search_path = ''
as $$
declare
  treasury_row public.treasuries;
  activation_row public.treasury_sui_activations;
begin
  select treasury.* into treasury_row
  from public.treasuries treasury
  where treasury.id = p_treasury_id
  for update;

  if treasury_row.id is null or treasury_row.owner_user_id <> p_owner_user_id then
    raise exception 'Treasury owner required';
  end if;
  if not exists (
    select 1 from public.wallet_profiles profile
    where profile.user_id = p_owner_user_id
      and profile.wallet_address = lower(p_owner_wallet_address)
  ) then
    raise exception 'Verified owner wallet required';
  end if;
  if treasury_row.sui_treasury_object_id is not null
    or treasury_row.sui_treasurer_cap_object_id is not null
    or treasury_row.sui_activation_status = 'active'
  then
    raise exception 'Treasury is already linked or active on Sui';
  end if;
  if not exists (
    select 1 from public.budget_categories category
    where category.treasury_id = p_treasury_id
  ) or (
    select coalesce(sum(category.allocated_minor), 0)
    from public.budget_categories category
    where category.treasury_id = p_treasury_id
  ) <> treasury_row.total_budget_minor then
    raise exception 'A balanced persisted budget is required before activation';
  end if;

  insert into public.treasury_sui_activations (
    treasury_id, owner_wallet_address, status
  ) values (
    p_treasury_id, lower(p_owner_wallet_address), 'in_progress'
  )
  on conflict (treasury_id) do nothing;

  select activation.* into activation_row
  from public.treasury_sui_activations activation
  where activation.treasury_id = p_treasury_id
  for update;

  if activation_row.owner_wallet_address <> lower(p_owner_wallet_address) then
    raise exception 'Activation belongs to a different verified owner wallet';
  end if;

  -- Intentionally do not lock the budget here. Opening the activation wizard is
  -- not a signed blockchain commitment. record_treasury_activation_signed()
  -- performs the one-time lock when the first Create digest is persisted.
  return activation_row;
end;
$$;

create or replace function public.record_treasury_activation_signed(
  p_treasury_id uuid,
  p_owner_user_id uuid,
  p_step text,
  p_digest text
)
returns public.treasury_sui_activations
language plpgsql
security definer
set search_path = ''
as $$
declare
  activation_row public.treasury_sui_activations;
  existing_digest text;
  existing_status text;
begin
  if not exists (
    select 1 from public.treasuries treasury
    where treasury.id = p_treasury_id and treasury.owner_user_id = p_owner_user_id
  ) then
    raise exception 'Treasury owner required';
  end if;
  if p_step not in ('create','fund','allocation') or char_length(p_digest) not between 1 and 100 then
    raise exception 'Invalid activation step or digest';
  end if;

  select activation.* into activation_row
  from public.treasury_sui_activations activation
  where activation.treasury_id = p_treasury_id
  for update;
  if activation_row.treasury_id is null then
    raise exception 'Treasury activation has not started';
  end if;

  if p_step = 'create' then
    existing_digest := activation_row.create_digest;
    existing_status := activation_row.create_status;
  elsif p_step = 'fund' then
    if activation_row.create_status <> 'confirmed' then
      raise exception 'Create must be confirmed before funding';
    end if;
    existing_digest := activation_row.fund_digest;
    existing_status := activation_row.fund_status;
  else
    if activation_row.fund_status <> 'confirmed' then
      raise exception 'Funding must be confirmed before allocations';
    end if;
    existing_digest := activation_row.allocation_digest;
    existing_status := activation_row.allocation_status;
  end if;

  if existing_status = 'confirmed' then
    raise exception 'Activation step is already confirmed';
  end if;
  if existing_status <> 'failed'
    and existing_digest is not null
    and existing_digest <> p_digest
  then
    raise exception 'Reconcile the existing activation digest before replacement';
  end if;

  -- The first signed Create digest is the irreversible product commitment point.
  -- Lock the current balanced budget atomically before accepting that digest.
  if p_step = 'create' then
    update public.treasuries
    set budget_locked_at = coalesce(budget_locked_at, now()),
        sui_activation_status = 'in_progress'
    where id = p_treasury_id
      and status = 'active'
      and sui_activation_status <> 'active';
    if not found then
      raise exception 'Treasury could not be locked for Sui activation';
    end if;
  end if;

  update public.treasury_sui_activations
  set create_status = case when p_step = 'create' then 'signed' else create_status end,
      create_digest = case when p_step = 'create' then p_digest else create_digest end,
      fund_status = case when p_step = 'fund' then 'signed' else fund_status end,
      fund_digest = case when p_step = 'fund' then p_digest else fund_digest end,
      allocation_status = case when p_step = 'allocation' then 'signed' else allocation_status end,
      allocation_digest = case when p_step = 'allocation' then p_digest else allocation_digest end,
      status = 'in_progress'
  where treasury_id = p_treasury_id
  returning * into activation_row;

  return activation_row;
end;
$$;

create or replace function public.reconcile_treasury_activation_step(
  p_treasury_id uuid,
  p_owner_user_id uuid,
  p_step text,
  p_digest text,
  p_outcome text,
  p_treasury_object_id text default null,
  p_treasurer_cap_object_id text default null
)
returns public.treasury_sui_activations
language plpgsql
security definer
set search_path = ''
as $$
declare
  activation_row public.treasury_sui_activations;
  saved_digest text;
begin
  if not exists (
    select 1 from public.treasuries treasury
    where treasury.id = p_treasury_id and treasury.owner_user_id = p_owner_user_id
  ) then
    raise exception 'Treasury owner required';
  end if;
  if p_step not in ('create','fund','allocation')
    or p_outcome not in ('confirmed','reconciliation_required','failed','failed_before_signing')
  then
    raise exception 'Invalid activation reconciliation transition';
  end if;

  select activation.* into activation_row
  from public.treasury_sui_activations activation
  where activation.treasury_id = p_treasury_id
  for update;

  if p_step = 'create' then
    saved_digest := activation_row.create_digest;
  elsif p_step = 'fund' then
    saved_digest := activation_row.fund_digest;
  else
    saved_digest := activation_row.allocation_digest;
  end if;

  if saved_digest is null or saved_digest <> p_digest then
    raise exception 'Reconciliation must use the exact saved activation digest';
  end if;

  if p_outcome = 'confirmed' and p_step = 'create' then
    if p_treasury_object_id is null or p_treasurer_cap_object_id is null then
      raise exception 'Verified Create object IDs are required';
    end if;
    if exists (
      select 1 from public.treasuries where sui_treasury_object_id = p_treasury_object_id
    ) or exists (
      select 1 from public.treasuries where sui_treasurer_cap_object_id = p_treasurer_cap_object_id
    ) then
      raise exception 'Verified Sui objects are already assigned';
    end if;
  end if;
  if p_outcome = 'confirmed' and p_step = 'fund'
    and activation_row.create_status <> 'confirmed'
  then
    raise exception 'Create must be confirmed before funding';
  end if;
  if p_outcome = 'confirmed' and p_step = 'allocation'
    and activation_row.fund_status <> 'confirmed'
  then
    raise exception 'Funding must be confirmed before allocations';
  end if;

  update public.treasury_sui_activations
  set create_status = case when p_step = 'create' then p_outcome else create_status end,
      create_confirmed_at = case when p_step = 'create' and p_outcome = 'confirmed' then now() else create_confirmed_at end,
      treasury_object_id = case when p_step = 'create' and p_outcome = 'confirmed' then p_treasury_object_id else treasury_object_id end,
      treasurer_cap_object_id = case when p_step = 'create' and p_outcome = 'confirmed' then p_treasurer_cap_object_id else treasurer_cap_object_id end,
      fund_status = case when p_step = 'fund' then p_outcome else fund_status end,
      fund_confirmed_at = case when p_step = 'fund' and p_outcome = 'confirmed' then now() else fund_confirmed_at end,
      allocation_status = case when p_step = 'allocation' then p_outcome else allocation_status end,
      allocation_confirmed_at = case when p_step = 'allocation' and p_outcome = 'confirmed' then now() else allocation_confirmed_at end,
      status = case
        when p_outcome = 'reconciliation_required' then 'reconciliation_required'
        when p_step = 'allocation' and p_outcome = 'confirmed' then 'active'
        else 'in_progress'
      end,
      activated_at = case when p_step = 'allocation' and p_outcome = 'confirmed' then now() else activated_at end
  where treasury_id = p_treasury_id
  returning * into activation_row;

  if p_step = 'allocation' and p_outcome = 'confirmed' then
    update public.treasuries
    set sui_treasury_object_id = activation_row.treasury_object_id,
        sui_treasurer_cap_object_id = activation_row.treasurer_cap_object_id,
        sui_activation_status = 'active',
        activated_at = activation_row.activated_at
    where id = p_treasury_id
      and sui_treasury_object_id is null
      and sui_treasurer_cap_object_id is null;
    if not found then
      raise exception 'Immutable Sui activation relationship could not be finalized';
    end if;
  elsif p_outcome = 'reconciliation_required' then
    update public.treasuries
    set sui_activation_status = 'reconciliation_required'
    where id = p_treasury_id;
  else
    -- confirmed intermediate steps and chain-proven failures both remain
    -- resumable in-progress states. A failed digest itself stays saved until a
    -- replacement signature is explicitly recorded.
    update public.treasuries
    set sui_activation_status = 'in_progress'
    where id = p_treasury_id;
  end if;

  return activation_row;
end;
$$;

revoke all on function public.start_treasury_sui_activation(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.record_treasury_activation_signed(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.reconcile_treasury_activation_step(uuid, uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.start_treasury_sui_activation(uuid, uuid, text) to service_role;
grant execute on function public.record_treasury_activation_signed(uuid, uuid, text, text) to service_role;
grant execute on function public.reconcile_treasury_activation_step(uuid, uuid, text, text, text, text, text) to service_role;
