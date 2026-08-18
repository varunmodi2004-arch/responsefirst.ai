-- ResponseFirst — Phase 1 (DB Foundation) + Phase 3 (n8n Core
-- Workflows) base schema, RECONSTRUCTED.
--
-- IMPORTANT: this file did not exist in any of the phase4/5/6
-- packages — only their *downstream* migrations and
-- lib/database.types.ts did, both of which assume this schema
-- already exists. This is a best-effort reconstruction built from:
--   - lib/database.types.ts (exact column names/types/nullability)
--   - README.md's Phase 2 section ("Builds on Phase 1: contractors,
--     customers, transcripts, briefs + handle_new_user")
--   - the actual Insert Transcript / Insert Brief / Insert
--     Notification HTTP nodes in workflow-1-call-to-brief.json,
--     which confirm the exact field set each insert sends
--   - the RLS conventions established in migrations 0002/0003
--     (Phase 5/6), applied backward to these tables
--
-- If the real Phase 1/3 migration exists somewhere, use that instead
-- — this is a faithful reconstruction, not a guaranteed match down to
-- every index and constraint name.

create extension if not exists pgcrypto;

-- ── 1. Enum types ──────────────────────────────────────────────────
-- Postgres has no `create type if not exists`; wrap each in a DO
-- block that swallows the duplicate-type error instead.

do $$ begin
  create type damage_type as enum ('roof', 'siding', 'gutters', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type urgency_level as enum ('low', 'medium', 'high', 'critical');
exception when duplicate_object then null; end $$;

do $$ begin
  create type brief_status as enum ('pending', 'contacted', 'booked', 'not_qualified', 'lost');
exception when duplicate_object then null; end $$;

do $$ begin
  create type transcript_status as enum ('processing', 'completed', 'no_brief', 'failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_type as enum ('new_lead', 'claim_created');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_channel as enum ('in_app', 'sms');
exception when duplicate_object then null; end $$;

-- ── 2. contractors ─────────────────────────────────────────────────

create table if not exists contractors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  company_name text,
  owner_name text,
  phone text,
  email text not null,
  twilio_phone_number text,
  retell_agent_id text,
  onboarding_completed boolean not null default false,
  timezone text not null default 'America/Chicago'
);

create index if not exists idx_contractors_user on contractors(user_id);

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_contractors_updated_at on contractors;
create trigger trg_contractors_updated_at
  before update on contractors
  for each row execute function set_updated_at();

-- Auto-provisions a contractors row the instant someone signs up —
-- the Next.js app (Phase 2) never inserts this row itself, it only
-- reads it. Per README.md: "If a login ever lands on /dashboard with
-- no contractor row, that's a Phase 1 database issue."
create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.contractors (user_id, email)
  values (new.id, new.email)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_auth_user_created on auth.users;
create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

alter table contractors enable row level security;

drop policy if exists "contractors_select_own" on contractors;
create policy "contractors_select_own" on contractors for select
  using (user_id = auth.uid());

drop policy if exists "contractors_update_own" on contractors;
create policy "contractors_update_own" on contractors for update
  using (user_id = auth.uid());
-- Column-level restriction to company_name/owner_name/phone/timezone
-- (per database.types.ts's Contractor Update type) is enforced at
-- the server-action layer, not via SQL column privileges — matches
-- how the rest of this schema handles partial-update contracts.

-- ── 3. customers ───────────────────────────────────────────────────

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  contractor_id uuid not null references contractors(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  property_address text
);

create index if not exists idx_customers_contractor on customers(contractor_id);
create index if not exists idx_customers_phone on customers(contractor_id, phone);

drop trigger if exists trg_customers_updated_at on customers;
create trigger trg_customers_updated_at
  before update on customers
  for each row execute function set_updated_at();

alter table customers enable row level security;

drop policy if exists "customers_select_own" on customers;
create policy "customers_select_own" on customers for select
  using (contractor_id in (select id from contractors where user_id = auth.uid()));

drop policy if exists "customers_update_own" on customers;
create policy "customers_update_own" on customers for update
  using (contractor_id in (select id from contractors where user_id = auth.uid()));
-- Inserts happen via n8n's service-role key (Workflow 1's "Find or
-- Create Customer" step) — no client-side insert policy needed.

-- ── 4. transcripts ─────────────────────────────────────────────────
-- Written entirely by Workflow 1 (Retell webhook → n8n → Supabase)
-- via the service role. Client only ever reads.

create table if not exists transcripts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  contractor_id uuid not null references contractors(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  retell_call_id text unique,
  caller_phone text not null,
  twilio_number text,
  duration_seconds integer,
  transcript_text text not null,
  recording_url text,
  status transcript_status not null default 'processing',
  raw_metadata jsonb not null default '{}',
  ai_model text,
  ai_input_tokens integer,
  ai_output_tokens integer,
  ai_cache_read_tokens integer,
  ai_cost_usd numeric(10, 4),
  ai_latency_ms integer
);

create index if not exists idx_transcripts_contractor on transcripts(contractor_id, created_at desc);
create unique index if not exists idx_transcripts_retell_call on transcripts(retell_call_id) where retell_call_id is not null;

alter table transcripts enable row level security;

drop policy if exists "transcripts_select_own" on transcripts;
create policy "transcripts_select_own" on transcripts for select
  using (contractor_id in (select id from contractors where user_id = auth.uid()));

-- ── 5. briefs ──────────────────────────────────────────────────────

create table if not exists briefs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  contractor_id uuid not null references contractors(id) on delete cascade,
  transcript_id uuid not null references transcripts(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  damage_type damage_type,
  damage_description text,
  damage_severity text,
  interior_damage boolean,
  insurance_carrier text,
  has_filed_claim boolean,
  claim_number text,
  competitor_mentioned boolean not null default false,
  competitor_name text,
  competitor_scheduled boolean not null default false,
  competitor_timing text,
  lead_score numeric(5, 1),
  estimated_value_low numeric(10, 2),
  estimated_value_high numeric(10, 2),
  urgency urgency_level,
  appointment_probability numeric(5, 2),
  recommended_action text,
  recommended_follow_up text,
  situation_summary text,
  suggested_opening text,
  risk_flags text[] not null default '{}',
  key_objections text[] not null default '{}',
  confidence_score numeric(5, 2),
  data_completeness numeric(5, 2),
  ai_model text,
  ai_raw_output jsonb,
  status brief_status not null default 'pending',
  status_updated_at timestamptz,
  notes text,
  notes_updated_at timestamptz
);

create index if not exists idx_briefs_contractor on briefs(contractor_id, created_at desc);
create index if not exists idx_briefs_status on briefs(contractor_id, status);
create index if not exists idx_briefs_customer on briefs(customer_id);

create or replace function set_brief_status_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  if old.status is distinct from new.status then
    new.status_updated_at = now();
  end if;
  if old.notes is distinct from new.notes then
    new.notes_updated_at = now();
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_briefs_updated_at on briefs;
create trigger trg_briefs_updated_at
  before update on briefs
  for each row execute function set_brief_status_updated_at();

alter table briefs enable row level security;

drop policy if exists "briefs_select_own" on briefs;
create policy "briefs_select_own" on briefs for select
  using (contractor_id in (select id from contractors where user_id = auth.uid()));

-- Only status + notes, per database.types.ts's Briefs Update type —
-- everything else (the AI-derived fields) is set once by Workflow 1
-- and never touched again by the client.
drop policy if exists "briefs_update_own" on briefs;
create policy "briefs_update_own" on briefs for update
  using (contractor_id in (select id from contractors where user_id = auth.uid()));

-- ── 6. notifications ───────────────────────────────────────────────
-- Created by Workflow 1 (new_lead) and later Workflow 2 (claim_created).
-- Unlike claims/briefs elsewhere in this app, notifications genuinely
-- are direct-RLS-writable by the client — but only for is_read/read_at
-- (database.types.ts's Notification Update type), which is exactly
-- what "mark as read" needs.

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  contractor_id uuid not null references contractors(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  link_type text check (link_type in ('brief', 'claim', 'report')),
  link_id uuid,
  channels_sent notification_channel[] not null default array['in_app']::notification_channel[],
  is_read boolean not null default false,
  read_at timestamptz
);

create index if not exists idx_notifications_contractor on notifications(contractor_id, is_read, created_at desc);

alter table notifications enable row level security;

drop policy if exists "notifications_select_own" on notifications;
create policy "notifications_select_own" on notifications for select
  using (contractor_id in (select id from contractors where user_id = auth.uid()));

drop policy if exists "notifications_update_own" on notifications;
create policy "notifications_update_own" on notifications for update
  using (contractor_id in (select id from contractors where user_id = auth.uid()));

-- ── 7. Realtime ────────────────────────────────────────────────────

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'briefs') then
    alter publication supabase_realtime add table briefs;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'notifications') then
    alter publication supabase_realtime add table notifications;
  end if;
end $$;

-- ── Sanity check ──────────────────────────────────────────────────
-- select id, email, onboarding_completed from contractors limit 5;
-- select id, status, lead_score from briefs order by created_at desc limit 5;
