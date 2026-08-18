-- Phase 5: Pipeline + Claims. Run after Phase 3's refactor migration.
--
-- Reconciliation from the original spec, applied consistently with
-- Phase 1/3/4's own precedent:
--   - homeowner_name/phone/email + property_address are NOT duplicated
--     here — claims.customer_id references the same customers row
--     transcripts/briefs already use. Same fix applied twice now.
--   - claims.brief_id is UNIQUE — gives Workflow 5 idempotency
--     ("a brief converts to at most one claim") for free, without
--     adding converted_to_claim/claim_id columns back onto briefs.
--   - damage_type reuses the existing enum (roof/siding/gutters/other)
--     from Phase 1, not the original doc's own inconsistent
--     hail/wind/water/fire/other — that inconsistency predates this
--     migration and isn't being fixed here, just not propagated further.

-- ============================================================
-- 1. New enums
-- ============================================================
create type public.claim_stage as enum (
  'claim_filed', 'adjuster_scheduled', 'estimate_received', 'supplement_filed',
  'supplement_approved', 'in_production', 'completed', 'payment_collected'
);

create type public.supplement_status as enum (
  'not_needed', 'opportunity_flagged', 'filed', 'pending_response',
  'approved', 'partially_approved', 'denied'
);

create type public.activity_type as enum (
  'stage_change', 'note_added', 'field_updated', 'alert_generated',
  'brief_linked', 'payment_recorded', 'claim_created'
);

-- One new value on the existing (deliberately narrow, per Phase 3)
-- notification_type enum. Not used elsewhere in THIS file, so there's
-- no same-transaction "unsafe use of new value" conflict — but if you
-- ever want to test-insert a claim_created notification by hand,
-- do it in a separate statement submission, not pasted alongside this
-- ALTER TYPE, since Postgres won't let a new enum value be used in
-- the same transaction that added it.
alter type public.notification_type add value 'claim_created';

-- ============================================================
-- 2. claims
-- ============================================================
create table public.claims (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  contractor_id uuid not null references public.contractors(id) on delete cascade,
  -- UNIQUE, not just indexed — this IS Workflow 5's idempotency guard.
  brief_id uuid unique references public.briefs(id),
  customer_id uuid not null references public.customers(id),

  insurance_carrier text,
  policy_number text,
  claim_number text,
  adjuster_name text,
  adjuster_phone text,
  adjuster_email text,

  damage_type public.damage_type,

  stage public.claim_stage not null default 'claim_filed',
  stage_entered_at timestamptz not null default now(),
  days_in_current_stage integer not null default 0,

  contractor_estimate numeric(10, 2),
  insurance_estimate numeric(10, 2),
  supplement_amount numeric(10, 2),
  supplement_status public.supplement_status not null default 'not_needed',
  final_approved_amount numeric(10, 2),
  deductible_amount numeric(10, 2),
  depreciation_holdback numeric(10, 2),
  amount_paid numeric(10, 2) not null default 0,
  amount_outstanding numeric(10, 2),

  adjuster_meeting_date timestamptz,
  adjuster_meeting_reminder_sent boolean not null default false,
  adjuster_2hr_reminder_sent boolean not null default false,
  estimate_received_date date,
  supplement_filed_date date,
  supplement_resolved_date date,
  production_start_date date,
  completion_date date,
  final_payment_date date,

  -- Real columns, real queries against them from day one — but the
  -- values stay false until Phase 6 ships the stall-detection cron
  -- that actually sets them. Same "Coming in Phase 6" situation the
  -- Today screen's stats bar already models for Phase 5 itself.
  is_stalled boolean not null default false,
  needs_attention boolean not null default false,
  stall_reason text,

  notes text
);

create index claims_contractor_id_idx on public.claims(contractor_id);
create index claims_stage_idx on public.claims(stage);
create index claims_contractor_stage_idx on public.claims(contractor_id, stage);
create index claims_needs_attention_idx on public.claims(contractor_id, needs_attention) where needs_attention = true;
create index claims_adjuster_meeting_idx on public.claims(adjuster_meeting_date) where adjuster_meeting_date is not null;
create index claims_created_at_idx on public.claims(created_at desc);

alter table public.claims enable row level security;

-- Deliberately full CRUD, unlike briefs' service-role-only-insert,
-- column-restricted-update pattern. Claims are manually managed by
-- the contractor (Add Claim form, all-fields-editable-inline); briefs
-- are AI-generated. That's a real difference in what these tables
-- are for, not an inconsistency to reconcile.
create policy claims_select_own on public.claims
  for select to authenticated using (contractor_id = current_contractor_id());
create policy claims_insert_own on public.claims
  for insert to authenticated with check (contractor_id = current_contractor_id());
create policy claims_update_own on public.claims
  for update to authenticated using (contractor_id = current_contractor_id())
  with check (contractor_id = current_contractor_id());
create policy claims_delete_own on public.claims
  for delete to authenticated using (contractor_id = current_contractor_id());

grant select, insert, update, delete on public.claims to authenticated;

-- ============================================================
-- 3. claim_activities — append-only audit log, never updated/deleted
-- ============================================================
create table public.claim_activities (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  contractor_id uuid not null references public.contractors(id) on delete cascade,
  activity_type public.activity_type not null,
  description text not null,
  old_value text,
  new_value text,
  source text not null default 'system' check (source in ('system', 'contractor', 'ai')),
  metadata jsonb not null default '{}'::jsonb
);

create index claim_activities_claim_id_idx on public.claim_activities(claim_id, created_at desc);

alter table public.claim_activities enable row level security;

create policy claim_activities_select_own on public.claim_activities
  for select to authenticated using (contractor_id = current_contractor_id());

-- WITH CHECK enforces source='contractor' specifically — a contractor
-- adding their own note can't spoof source='system' or 'ai' on it.
-- Service role (n8n) bypasses RLS entirely for its own system/ai-
-- sourced inserts, same as everywhere else in this project.
create policy claim_activities_insert_contractor on public.claim_activities
  for insert to authenticated
  with check (contractor_id = current_contractor_id() and source = 'contractor');

grant select, insert on public.claim_activities to authenticated;
-- No update/delete grant at all, to anyone but service_role — matches
-- the spec's "Never/Never" for this table exactly.

-- ============================================================
-- 4. Triggers
-- ============================================================

-- Reuses the EXISTING set_updated_at() function from Phase 1 —
-- nothing new to define, just one more table attached to it.
create trigger trg_claims_updated_at
  before update on public.claims
  for each row
  execute function public.set_updated_at();

-- compute_amount_outstanding: straightforward BEFORE trigger, matches
-- the spec exactly (fires on INSERT and UPDATE, since either can
-- change the amounts it depends on).
create or replace function public.compute_amount_outstanding()
returns trigger
language plpgsql
as $$
begin
  new.amount_outstanding := coalesce(new.final_approved_amount, new.contractor_estimate, 0)
                            - coalesce(new.amount_paid, 0);
  return new;
end;
$$;

create trigger trg_compute_amount_outstanding
  before insert or update on public.claims
  for each row
  execute function public.compute_amount_outstanding();

-- log_claim_stage_change: the spec describes this as an AFTER
-- trigger, but built as BEFORE here on purpose — an AFTER trigger's
-- NEW is already committed, so it can't reset stage_entered_at /
-- days_in_current_stage / is_stalled / needs_attention / stall_reason
-- on the SAME row the way "modify NEW and return it" does in a BEFORE
-- trigger. This is the same described behavior, just implemented the
-- way that can actually achieve it in one trigger rather than needing
-- a second UPDATE statement from within an AFTER trigger.
create or replace function public.log_claim_stage_change()
returns trigger
language plpgsql
as $$
begin
  insert into public.claim_activities (claim_id, contractor_id, activity_type, description, old_value, new_value, source)
  values (
    new.id, new.contractor_id, 'stage_change',
    format('Stage changed from %s to %s', old.stage, new.stage),
    old.stage::text, new.stage::text, 'contractor'
  );

  new.stage_entered_at := now();
  new.days_in_current_stage := 0;
  new.is_stalled := false;
  new.needs_attention := false;
  new.stall_reason := null;

  return new;
end;
$$;

create trigger trg_log_claim_stage_change
  before update on public.claims
  for each row
  when (old.stage is distinct from new.stage)
  execute function public.log_claim_stage_change();

-- handle_brief_booked (Trigger 4 in the original spec) needs nothing
-- new — Phase 1's existing set_briefs_field_timestamps() trigger
-- already stamps status_updated_at on ANY briefs.status change,
-- booked included. Nothing to add here.

-- ============================================================
-- 4b. briefs -> Workflow 5 trigger (the side-effecting part of
--     "Brief Booked → Create Claim" the original spec explicitly says
--     belongs in n8n, not a database trigger, since it sends SMS and
--     creates notifications — side effects a trigger shouldn't own)
-- ============================================================
-- Same Vault secret as Workflows 2 and 3 — no new secret needed.
-- UPDATE, not INSERT, and specifically gated on the TRANSITION into
-- 'booked' — this is the first trigger in the project keyed off UPDATE
-- rather than INSERT, since "booked" is a state a contractor moves
-- into via the dashboard's outcome buttons, not something created
-- fresh. Firing on every subsequent update to an already-booked brief
-- (e.g. a later notes edit) would be wrong — the WHEN clause prevents
-- that the same way the transcripts/notifications triggers guard
-- against re-firing on their own later updates.
create or replace function public.notify_workflow5_brief_booked()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  webhook_secret text;
begin
  select decrypted_secret into webhook_secret
  from vault.decrypted_secrets
  where name = 'internal_webhook_secret';

  perform net.http_post(
    -- EDIT to match your actual n8n host.
    url := 'https://automate.responsefirst.ai/webhook/brief-booked',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || webhook_secret
    ),
    body := jsonb_build_object('record', to_jsonb(new))
  );

  return new;
end;
$$;

create trigger trg_notify_workflow5_brief_booked
  after update on public.briefs
  for each row
  when (new.status = 'booked' and old.status is distinct from 'booked')
  execute function public.notify_workflow5_brief_booked();

-- ============================================================
-- 5. Realtime — same requirement Phase 4 hit for briefs/notifications
-- ============================================================
alter publication supabase_realtime add table public.claims;

-- ============================================================
-- Verify after running:
--   select enumlabel from pg_enum where enumtypid = 'notification_type'::regtype;
--   -- should include 'claim_created'
--
--   select tgname from pg_trigger where tgrelid = 'public.claims'::regclass;
--   -- should list trg_claims_updated_at, trg_compute_amount_outstanding,
--   -- trg_log_claim_stage_change
--
--   select tablename from pg_publication_tables where pubname = 'supabase_realtime';
--   -- should now include claims, alongside briefs and notifications
-- ============================================================
