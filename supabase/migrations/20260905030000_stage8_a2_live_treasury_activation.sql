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
