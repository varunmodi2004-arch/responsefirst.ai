-- Phase 6: Stalls, Alerts, Reminders. Run after Phase 5's migration.

-- ============================================================
-- 1. Three new notification_type values
-- ============================================================
alter type public.notification_type add value 'stalled_claim';
alter type public.notification_type add value 'adjuster_reminder';
alter type public.notification_type add value 'supplement_opportunity';

-- ============================================================
-- 2. Narrow Workflow 3's trigger to the two types it actually makes
--    a decision about. Postgres has no ALTER TRIGGER for changing a
--    WHEN clause — drop and recreate is the only way.
--
-- Why this is needed at all: Workflow 6/7/8 below each already send
-- their own SMS directly and set channels_sent themselves (a digest,
-- a time-critical reminder, and a one-time alert respectively — none
-- of them fit Workflow 3's "one notification, one conditional
-- decision" shape). Without this WHEN clause, every insert from those
-- three workflows would ALSO fire Workflow 3, which has no branch for
-- these types and would either error or need three more branches
-- added to it — duplicating decision logic those workflows already
-- contain. Narrowing the trigger is the smaller, more isolated fix.
-- ============================================================
drop trigger trg_notify_workflow3_new_notification on public.notifications;

create trigger trg_notify_workflow3_new_notification
  after insert on public.notifications
  for each row
  when (new.type in ('new_lead', 'claim_created'))
  execute function public.notify_workflow3_new_notification();

-- ============================================================
-- 3. claims -> Workflow 8 trigger (Supplement Gap Detection)
-- ============================================================
-- WHEN clause fires only on the null -> not-null transition of
-- insurance_estimate — a later edit to an already-set estimate does
-- NOT re-fire this. Matches "detected when the estimate is entered,"
-- not "re-evaluated on every edit."
create or replace function public.notify_workflow8_supplement_gap()
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
    -- EDIT to match your actual n8n Cloud instance URL.
    url := 'https://your-instance.app.n8n.cloud/webhook/supplement-gap',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || webhook_secret
    ),
    body := jsonb_build_object('record', to_jsonb(new))
  );

  return new;
end;
$$;

create trigger trg_notify_workflow8_supplement_gap
  after update on public.claims
  for each row
  when (new.insurance_estimate is not null and old.insurance_estimate is null)
  execute function public.notify_workflow8_supplement_gap();

-- ============================================================
-- Verify after running:
--   select enumlabel from pg_enum where enumtypid = 'notification_type'::regtype;
--   -- 5 values: new_lead, claim_created, stalled_claim, adjuster_reminder, supplement_opportunity
--
--   select pg_get_triggerdef(oid) from pg_trigger
--   where tgname = 'trg_notify_workflow3_new_notification';
--   -- should show the new WHEN clause
--
--   select tgname from pg_trigger where tgname = 'trg_notify_workflow8_supplement_gap';
-- ============================================================
