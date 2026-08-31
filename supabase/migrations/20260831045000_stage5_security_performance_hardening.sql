-- Remove unauthenticated RPC access that Supabase grants to functions by
-- default, while retaining the authenticated access required by RLS and the
-- claim-review workflow.
revoke all on function public.can_access_treasury(uuid) from anon;
revoke all on function public.can_manage_treasury(uuid) from anon;
revoke all on function public.decide_claim(uuid, public.claim_decision, text) from anon;

-- Cover foreign keys used during updates/deletes and relationship checks.
create index if not exists claims_category_treasury_fk_idx
  on public.claims (category_id, treasury_id);
create index if not exists claims_decided_by_idx
  on public.claims (decided_by);
create index if not exists treasury_members_user_id_idx
  on public.treasury_members (user_id);
