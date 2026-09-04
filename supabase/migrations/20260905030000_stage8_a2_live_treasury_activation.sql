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
