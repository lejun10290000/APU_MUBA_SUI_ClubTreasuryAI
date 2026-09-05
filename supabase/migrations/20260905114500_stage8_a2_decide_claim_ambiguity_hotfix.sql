-- Stage 8 A2 smoke-test hotfix: remove PL/pgSQL ambiguity in claim approval.
-- Forward-only replacement of decide_claim; preserves the existing A1/A2
-- human-decision, treasury-link, and immutable approved-snapshot boundaries.

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
  linked_treasury_object_id text;
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
  into category_reference, linked_treasury_object_id
  from public.budget_categories category
  join public.treasuries treasury on treasury.id = category.treasury_id
  where category.id = claim_row.category_id
    and category.treasury_id = claim_row.treasury_id;

  if p_decision = 'approve' then
    if linked_treasury_object_id is null then
      raise exception 'Link this treasury to Sui before approval';
    end if;

    if claim_row.treasury_object_id is not null
      and claim_row.treasury_object_id is distinct from linked_treasury_object_id
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
        treasury_object_id = linked_treasury_object_id,
        approved_treasury_object_id = linked_treasury_object_id,
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
