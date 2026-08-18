-- Phase 4 prerequisite. Run in the Supabase SQL Editor after Phase 3's
-- migration. Without this, postgres_changes subscriptions on these two
-- tables silently receive nothing — no error, no warning, just no
-- events, which is a nasty thing to debug blind from the dashboard side.

alter publication supabase_realtime add table public.briefs;
alter publication supabase_realtime add table public.notifications;

-- Verify with:
--   select schemaname, tablename from pg_publication_tables
--   where pubname = 'supabase_realtime';
-- Both briefs and notifications should be listed.
