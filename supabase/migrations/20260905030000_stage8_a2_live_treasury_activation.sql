-- Stage 8 A2: first-class, resumable per-workspace Sui activation.
-- This is forward-only and intentionally does not backfill legacy workspaces.

alter table public.treasuries
  add column if not exists sui_treasurer_cap_object_id text,
  add column if not exists sui_activation_status text not null default 'not_started',
  add column if not exists budget_locked_at timestamptz,
  add column if not exists activated_at timestamptz;

alter table public.treasuries
  add constraint treasuries_sui_cap_object_id_check
  check (
    sui_treasurer_cap_object_id is null
    or sui_treasurer_cap_object_id ~ '^0x[0-9a-f]{64}$'
  ),
  add constraint treasuries_sui_activation_status_check
  check (sui_activation_status in ('not_started','in_progress','reconciliation_required','active')),
  add constraint treasuries_sui_active_objects_check
  check (
    sui_activation_status <> 'active'
    or (
      sui_treasury_object_id is not null
      and sui_treasurer_cap_object_id is not null
      and budget_locked_at is not null
      and activated_at is not null
    )
  );

create unique index if not exists treasuries_sui_cap_unique
  on public.treasuries (sui_treasurer_cap_object_id)
  where sui_treasurer_cap_object_id is not null;

create table if not exists public.treasury_sui_activations (
  treasury_id uuid primary key references public.treasuries(id) on delete cascade,
  owner_wallet_address text not null
    check (owner_wallet_address ~ '^0x[0-9a-f]{64}$'),
  status text not null default 'not_started'
    check (status in ('not_started','in_progress','reconciliation_required','active')),
  create_status text not null default 'not_started'
    check (create_status in ('not_started','signed','submitted','confirmed','reconciliation_required','failed_before_signing')),
  create_digest text,
  create_confirmed_at timestamptz,
  treasury_object_id text check (
    treasury_object_id is null or treasury_object_id ~ '^0x[0-9a-f]{64}$'
  ),
  treasurer_cap_object_id text check (
    treasurer_cap_object_id is null or treasurer_cap_object_id ~ '^0x[0-9a-f]{64}$'
  ),
  fund_status text not null default 'not_started'
    check (fund_status in ('not_started','signed','submitted','confirmed','reconciliation_required','failed_before_signing')),
  fund_digest text,
  fund_confirmed_at timestamptz,
  allocation_status text not null default 'not_started'
    check (allocation_status in ('not_started','signed','submitted','confirmed','reconciliation_required','failed_before_signing')),
  allocation_digest text,
  allocation_confirmed_at timestamptz,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists treasury_sui_activations_treasury_object_unique
  on public.treasury_sui_activations (treasury_object_id)
  where treasury_object_id is not null;
create unique index if not exists treasury_sui_activations_cap_object_unique
  on public.treasury_sui_activations (treasurer_cap_object_id)
  where treasurer_cap_object_id is not null;

create trigger treasury_sui_activations_set_updated_at
before update on public.treasury_sui_activations
for each row execute function public.set_updated_at();

alter table public.treasury_sui_activations enable row level security;

create policy "owners read treasury Sui activation"
on public.treasury_sui_activations
for select
to authenticated
using (public.can_manage_treasury(treasury_id));

revoke all on table public.treasury_sui_activations from anon;
revoke insert, update, delete on table public.treasury_sui_activations from authenticated;
grant select on table public.treasury_sui_activations to authenticated;

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
  treasury_row public.treasuries;
  allocation_total numeric;
begin
  if public.current_wallet_user_id() is null then
    raise exception 'Authentication required';
  end if;
  if not public.can_manage_treasury(p_treasury_id) then
    raise exception 'Treasurer role required';
  end if;

  select treasury.* into treasury_row
  from public.treasuries treasury
  where treasury.id = p_treasury_id and treasury.status = 'active'
  for update;

  if treasury_row.id is null then
    raise exception 'Active treasury not found';
  end if;
  if treasury_row.budget_locked_at is not null
    or treasury_row.sui_activation_status <> 'not_started'
  then
    raise exception 'Budget is locked because Sui activation has started';
  end if;
  if exists (
    select 1 from public.claims claim where claim.treasury_id = p_treasury_id
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
      or not (item ? 'external_reference')
      or not (item ? 'allocated_minor')
      or char_length(btrim(item ->> 'name')) not between 1 and 80
      or (item ->> 'external_reference') !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
      or (item ->> 'allocated_minor') !~ '^[0-9]+$'
      or (item ->> 'allocated_minor')::numeric <= 0
      or (item ->> 'allocated_minor')::numeric > 9007199254740991
  ) then
    raise exception 'Budget categories require valid names, references, and allocations';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_categories) item
    group by item ->> 'external_reference'
    having count(*) > 1
  ) then
    raise exception 'Budget category Sui references must be unique';
  end if;

  select sum((item ->> 'allocated_minor')::numeric) into allocation_total
  from jsonb_array_elements(p_categories) item;
  if allocation_total <> treasury_row.total_budget_minor then
    raise exception 'Budget categories must sum exactly to the treasury total';
  end if;

  delete from public.budget_categories category
  where category.treasury_id = p_treasury_id;

  insert into public.budget_categories (
    treasury_id, external_reference, name, allocated_minor, spent_minor
  )
  select
    p_treasury_id,
    item ->> 'external_reference',
    btrim(item ->> 'name'),
    (item ->> 'allocated_minor')::bigint,
    0
  from jsonb_array_elements(p_categories) item;

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

  update public.treasuries
  set budget_locked_at = coalesce(budget_locked_at, now()),
      sui_activation_status = case
        when sui_activation_status = 'not_started' then 'in_progress'
        else sui_activation_status
      end
  where id = p_treasury_id;

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
    if activation_row.create_status <> 'confirmed' then raise exception 'Create must be confirmed before funding'; end if;
    existing_digest := activation_row.fund_digest;
    existing_status := activation_row.fund_status;
  else
    if activation_row.fund_status <> 'confirmed' then raise exception 'Funding must be confirmed before allocations'; end if;
    existing_digest := activation_row.allocation_digest;
    existing_status := activation_row.allocation_status;
  end if;

  if existing_status = 'confirmed' then raise exception 'Activation step is already confirmed'; end if;
  if existing_digest is not null and existing_digest <> p_digest then
    raise exception 'Reconcile the existing activation digest before replacement';
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
  ) then raise exception 'Treasury owner required'; end if;
  if p_step not in ('create','fund','allocation')
    or p_outcome not in ('confirmed','reconciliation_required','failed_before_signing')
  then raise exception 'Invalid activation reconciliation transition'; end if;

  select activation.* into activation_row
  from public.treasury_sui_activations activation
  where activation.treasury_id = p_treasury_id
  for update;
  if p_step = 'create' then saved_digest := activation_row.create_digest;
  elsif p_step = 'fund' then saved_digest := activation_row.fund_digest;
  else saved_digest := activation_row.allocation_digest;
  end if;
  if saved_digest is null or saved_digest <> p_digest then
    raise exception 'Reconciliation must use the exact saved activation digest';
  end if;

  if p_outcome = 'confirmed' and p_step = 'create' then
    if p_treasury_object_id is null or p_treasurer_cap_object_id is null then
      raise exception 'Verified Create object IDs are required';
    end if;
    if exists (select 1 from public.treasuries where sui_treasury_object_id = p_treasury_object_id)
      or exists (select 1 from public.treasuries where sui_treasurer_cap_object_id = p_treasurer_cap_object_id)
    then raise exception 'Verified Sui objects are already assigned'; end if;
  end if;
  if p_outcome = 'confirmed' and p_step = 'fund' and activation_row.create_status <> 'confirmed' then
    raise exception 'Create must be confirmed before funding';
  end if;
  if p_outcome = 'confirmed' and p_step = 'allocation' and activation_row.fund_status <> 'confirmed' then
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
    if not found then raise exception 'Immutable Sui activation relationship could not be finalized'; end if;
  elsif p_outcome = 'reconciliation_required' then
    update public.treasuries set sui_activation_status = 'reconciliation_required'
    where id = p_treasury_id;
  else
    update public.treasuries set sui_activation_status = 'in_progress'
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
