-- Stage 5: persisted claim and private receipt workflow.
-- Money movement is intentionally absent. Approved claims remain unpaid.

create type public.treasury_member_role as enum ('owner', 'treasurer', 'member');
create type public.claim_status as enum (
  'submitted',
  'under_review',
  'approved_unpaid',
  'rejected'
);
create type public.claim_recommendation as enum ('approve', 'review', 'reject');
create type public.claim_decision as enum ('approve', 'reject');

create table public.wallet_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  wallet_address text not null unique,
  display_name text not null,
  verified_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wallet_profiles_sui_address_check
    check (wallet_address ~ '^0x[0-9a-f]{64}$'),
  constraint wallet_profiles_display_name_check
    check (char_length(btrim(display_name)) between 1 and 80)
);

-- This table is never granted to browser roles. Only the wallet verification
-- server route, using the server-only secret key, may create or consume rows.
create table public.wallet_nonces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_address text not null,
  message text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint wallet_nonces_sui_address_check
    check (wallet_address ~ '^0x[0-9a-f]{64}$'),
  constraint wallet_nonces_expiry_check
    check (expires_at > created_at)
);

create index wallet_nonces_user_created_idx
  on public.wallet_nonces (user_id, created_at desc);

create table public.treasuries (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.wallet_profiles(user_id),
  external_reference text not null,
  name text not null,
  currency text not null default 'USDC',
  total_budget_minor bigint not null,
  sui_treasury_object_id text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint treasuries_owner_external_unique
    unique (owner_user_id, external_reference),
  constraint treasuries_name_check
    check (char_length(btrim(name)) between 1 and 120),
  constraint treasuries_currency_check check (currency = 'USDC'),
  constraint treasuries_budget_check check (total_budget_minor > 0),
  constraint treasuries_object_id_check
    check (sui_treasury_object_id ~ '^0x[0-9a-f]{64}$'),
  constraint treasuries_object_id_unique unique (sui_treasury_object_id),
  constraint treasuries_status_check check (status in ('active', 'closed'))
);

create table public.treasury_members (
  treasury_id uuid not null references public.treasuries(id) on delete cascade,
  user_id uuid not null references public.wallet_profiles(user_id) on delete cascade,
  role public.treasury_member_role not null,
  created_at timestamptz not null default now(),
  primary key (treasury_id, user_id)
);

create table public.budget_categories (
  id uuid primary key default gen_random_uuid(),
  treasury_id uuid not null references public.treasuries(id) on delete cascade,
  external_reference text not null,
  name text not null,
  allocated_minor bigint not null,
  spent_minor bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budget_categories_treasury_external_unique
    unique (treasury_id, external_reference),
  constraint budget_categories_id_treasury_unique unique (id, treasury_id),
  constraint budget_categories_name_check
    check (char_length(btrim(name)) between 1 and 80),
  constraint budget_categories_allocation_check check (allocated_minor > 0),
  constraint budget_categories_spend_check
    check (spent_minor >= 0 and spent_minor <= allocated_minor)
);

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  external_reference text not null,
  treasury_id uuid not null references public.treasuries(id),
  category_id uuid not null,
  treasury_object_id text not null,
  member_user_id uuid not null references public.wallet_profiles(user_id),
  member_wallet_address text not null,
  recipient_sui_address text not null,
  submitter_name text not null,
  merchant text not null,
  description text not null,
  requested_amount_minor bigint not null,
  receipt_amount_minor bigint,
  currency text not null default 'USDC',
  receipt_reference text,
  receipt_path text not null unique,
  receipt_hash text not null,
  receipt_mime_type text not null,
  receipt_size_bytes bigint not null,
  receipt_analysis jsonb,
  duplicate_match jsonb not null default '{"exactIds":[],"similarIds":[]}'::jsonb,
  recommendation public.claim_recommendation,
  recommendation_reasons jsonb not null default '[]'::jsonb,
  recommendation_at timestamptz,
  status public.claim_status not null default 'submitted',
  decision public.claim_decision,
  decision_reason text,
  decided_by uuid references public.wallet_profiles(user_id),
  decided_at timestamptz,
  payment_status text not null default 'unpaid',
  approved_treasury_object_id text,
  approved_category_reference text,
  approved_recipient_sui_address text,
  approved_amount_minor bigint,
  approved_currency text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint claims_category_treasury_fk
    foreign key (category_id, treasury_id)
    references public.budget_categories(id, treasury_id),
  constraint claims_member_external_unique
    unique (member_user_id, external_reference),
  constraint claims_treasury_object_id_check
    check (treasury_object_id ~ '^0x[0-9a-f]{64}$'),
  constraint claims_member_wallet_check
    check (member_wallet_address ~ '^0x[0-9a-f]{64}$'),
  constraint claims_recipient_wallet_check
    check (recipient_sui_address ~ '^0x[0-9a-f]{64}$'),
  constraint claims_submitter_check
    check (char_length(btrim(submitter_name)) between 1 and 80),
  constraint claims_merchant_check
    check (char_length(btrim(merchant)) between 1 and 120),
  constraint claims_description_check
    check (char_length(btrim(description)) between 1 and 240),
  constraint claims_amount_check check (requested_amount_minor > 0),
  constraint claims_receipt_amount_check
    check (receipt_amount_minor is null or receipt_amount_minor > 0),
  constraint claims_currency_check check (currency = 'USDC'),
  constraint claims_receipt_hash_check
    check (receipt_hash ~ '^[0-9a-f]{64}$'),
  constraint claims_receipt_mime_check
    check (receipt_mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  constraint claims_receipt_size_check
    check (receipt_size_bytes between 1 and 10485760),
  constraint claims_payment_status_check check (payment_status = 'unpaid'),
  constraint claims_recommendation_state_check check (
    (status = 'submitted' and recommendation is null and recommendation_at is null)
    or
    (status <> 'submitted' and recommendation is not null and recommendation_at is not null)
  ),
  constraint claims_decision_state_check check (
    (status in ('submitted', 'under_review') and decision is null and decision_reason is null and decided_by is null and decided_at is null)
    or
    (status = 'rejected' and decision = 'reject' and decision_reason is not null and decided_by is not null and decided_at is not null)
    or
    (status = 'approved_unpaid' and decision = 'approve' and decision_reason is not null and decided_by is not null and decided_at is not null)
  ),
  constraint claims_decision_reason_check
    check (decision_reason is null or char_length(btrim(decision_reason)) between 1 and 240),
  constraint claims_approved_snapshot_check check (
    (
      status = 'approved_unpaid'
      and approved_treasury_object_id is not null
      and approved_category_reference is not null
      and approved_recipient_sui_address is not null
      and approved_amount_minor is not null
      and approved_currency = 'USDC'
    )
    or
    (
      status <> 'approved_unpaid'
      and approved_treasury_object_id is null
      and approved_category_reference is null
      and approved_recipient_sui_address is null
      and approved_amount_minor is null
      and approved_currency is null
    )
  )
);

create index claims_treasury_created_idx
  on public.claims (treasury_id, created_at desc);
create index claims_member_created_idx
  on public.claims (member_user_id, created_at desc);
create index claims_receipt_hash_idx on public.claims (receipt_hash);
create index claims_similar_duplicate_idx
  on public.claims (treasury_id, lower(merchant), requested_amount_minor);
create index claims_category_treasury_fk_idx
  on public.claims (category_id, treasury_id);
create index claims_decided_by_idx on public.claims (decided_by);
create index treasury_members_user_id_idx
  on public.treasury_members (user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger wallet_profiles_set_updated_at
before update on public.wallet_profiles
for each row execute function public.set_updated_at();

create trigger treasuries_set_updated_at
before update on public.treasuries
for each row execute function public.set_updated_at();

create trigger budget_categories_set_updated_at
before update on public.budget_categories
for each row execute function public.set_updated_at();

create trigger claims_set_updated_at
before update on public.claims
for each row execute function public.set_updated_at();

create or replace function public.protect_claim_evidence()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.receipt_path is distinct from old.receipt_path
    or new.receipt_reference is distinct from old.receipt_reference
    or new.receipt_hash is distinct from old.receipt_hash
    or new.receipt_mime_type is distinct from old.receipt_mime_type
    or new.receipt_size_bytes is distinct from old.receipt_size_bytes
  then
    raise exception 'Receipt evidence is immutable';
  end if;

  if old.status = 'approved_unpaid' and (
    new.approved_treasury_object_id is distinct from old.approved_treasury_object_id
    or new.approved_category_reference is distinct from old.approved_category_reference
    or new.approved_recipient_sui_address is distinct from old.approved_recipient_sui_address
    or new.approved_amount_minor is distinct from old.approved_amount_minor
    or new.approved_currency is distinct from old.approved_currency
  ) then
    raise exception 'Approved payout snapshot is immutable';
  end if;

  return new;
end;
$$;

create trigger claims_protect_evidence
before update on public.claims
for each row execute function public.protect_claim_evidence();

alter table public.wallet_profiles enable row level security;
alter table public.wallet_nonces enable row level security;
alter table public.treasuries enable row level security;
alter table public.treasury_members enable row level security;
alter table public.budget_categories enable row level security;
alter table public.claims enable row level security;

-- These narrow helper functions prevent recursive RLS lookups between the
-- treasury and membership tables. They are read-only, explicitly scoped to
-- auth.uid(), and run with an empty search_path.
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
      and treasury.owner_user_id = auth.uid()
  ) or exists (
    select 1 from public.treasury_members member
    where member.treasury_id = p_treasury_id
      and member.user_id = auth.uid()
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
      and treasury.owner_user_id = auth.uid()
  ) or exists (
    select 1 from public.treasury_members member
    where member.treasury_id = p_treasury_id
      and member.user_id = auth.uid()
      and member.role in ('owner', 'treasurer')
  );
$$;

revoke all on function public.can_access_treasury(uuid) from public;
revoke all on function public.can_manage_treasury(uuid) from public;
revoke all on function public.can_access_treasury(uuid) from anon;
revoke all on function public.can_manage_treasury(uuid) from anon;
grant execute on function public.can_access_treasury(uuid) to authenticated;
grant execute on function public.can_manage_treasury(uuid) to authenticated;

create policy "wallet owners read their verified profile"
on public.wallet_profiles for select
to authenticated
using (user_id = (select auth.uid()));

create policy "treasury members read accessible treasuries"
on public.treasuries for select
to authenticated
using (
  public.can_access_treasury(id)
);

create policy "verified wallet owners create treasuries"
on public.treasuries for insert
to authenticated
with check (
  owner_user_id = (select auth.uid())
  and exists (
    select 1 from public.wallet_profiles profile
    where profile.user_id = (select auth.uid())
  )
);

create policy "owners update their treasuries"
on public.treasuries for update
to authenticated
using (owner_user_id = (select auth.uid()))
with check (owner_user_id = (select auth.uid()));

create policy "members read their membership and owners read their roster"
on public.treasury_members for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.can_manage_treasury(treasury_id)
);

create policy "owners manage treasury membership"
on public.treasury_members for insert
to authenticated
with check (
  public.can_manage_treasury(treasury_id)
  and exists (
    select 1 from public.wallet_profiles profile
    where profile.user_id = treasury_members.user_id
  )
);

create policy "owners update treasury roles"
on public.treasury_members for update
to authenticated
using (
  public.can_manage_treasury(treasury_id)
)
with check (
  public.can_manage_treasury(treasury_id)
);

create policy "members read treasury categories"
on public.budget_categories for select
to authenticated
using (
  public.can_access_treasury(treasury_id)
);

create policy "owners create treasury categories"
on public.budget_categories for insert
to authenticated
with check (
  public.can_manage_treasury(treasury_id)
);

create policy "owners update treasury categories"
on public.budget_categories for update
to authenticated
using (
  public.can_manage_treasury(treasury_id)
)
with check (
  public.can_manage_treasury(treasury_id)
);

create policy "claim participants read claims"
on public.claims for select
to authenticated
using (
  member_user_id = (select auth.uid())
  or public.can_manage_treasury(treasury_id)
);

create policy "verified members submit their own claims"
on public.claims for insert
to authenticated
with check (
  member_user_id = (select auth.uid())
  and member_wallet_address = (
    select profile.wallet_address
    from public.wallet_profiles profile
    where profile.user_id = (select auth.uid())
  )
  and split_part(receipt_path, '/', 1) = (select auth.uid())::text
  and public.can_access_treasury(treasury_id)
);

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
  actor uuid := auth.uid();
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

revoke all on table
  public.wallet_profiles,
  public.wallet_nonces,
  public.treasuries,
  public.treasury_members,
  public.budget_categories,
  public.claims
from anon, authenticated;
grant select on public.wallet_profiles to authenticated;
grant select, insert, update on public.treasuries to authenticated;
grant select, insert on public.treasury_members to authenticated;
grant update (role) on public.treasury_members to authenticated;
grant select, insert on public.budget_categories to authenticated;
grant update (name, allocated_minor, spent_minor) on public.budget_categories to authenticated;
grant select, insert on public.claims to authenticated;
grant usage on type public.treasury_member_role to authenticated;
grant usage on type public.claim_status to authenticated;
grant usage on type public.claim_recommendation to authenticated;
grant usage on type public.claim_decision to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts',
  'receipts',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "members upload immutable receipt evidence"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'receipts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "members read their own receipt evidence"
on storage.objects for select
to authenticated
using (
  bucket_id = 'receipts'
  and owner_id = (select auth.uid())::text
);
