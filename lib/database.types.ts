/**
 * Hand-written types matching the Phase 1 + Phase 3 migrations.
 *
 * Once the Supabase CLI is linked to the real project, replace this
 * file with the generated version:
 *
 *   supabase gen types typescript --project-id <project-ref> > lib/database.types.ts
 *
 * That command produces a `Database` type in the same shape Supabase's
 * client expects, so nothing downstream (createClient<Database>(...))
 * has to change when you swap this out.
 *
 * Phase 2A-0 (Aug 13, 2026): re-verified directly against live Supabase.
 * Several enums and `briefs` columns exist live but were missing from this
 * file (and from dashboard_phase2_implementation_spec.md v3.1's schema
 * section) — see PHASE2_DATA_CONTRACT_ADDENDUM.md for the full reconciliation.
 * Per decision, live schema is the DB source of truth; this file now matches it.
 */

export type DamageType =
  | "hail" | "wind" | "water" | "fire" | "other"
  | "tree_impact" | "age_wear" | "unknown_storm";
export type UrgencyLevel = "low" | "medium" | "high" | "critical" | "emergency" | "standard";
export type BriefStatus = "pending" | "contacted" | "booked" | "not_qualified" | "lost" | "follow_up";
export type TranscriptStatus = "processing" | "completed" | "no_brief" | "failed";
export type NotificationType =
  | "new_lead" | "claim_created" | "stalled_claim" | "adjuster_reminder"
  | "supplement_opportunity" | "payment_due" | "weekly_report" | "follow_up_reminder";
/** V2 Win Brief fields. AI schema allows "UNKNOWN" as an explicit value for
 * some of these (distinct from SQL null — see PHASE2_DATA_CONTRACT_ADDENDUM.md
 * §"Gotcha"). ~93% of current briefs have all of these as null (pre-V2 rows). */
export type Qualification = "qualified" | "not_qualified" | "spam" | "wrong_number";
export type ContactPermission = "granted" | "declined" | "UNKNOWN";
export type CompetitorStatus = "contacted" | "inspected" | "quoted" | "scheduled" | "already_hired" | "UNKNOWN";
export type ResponseSla = "immediate" | "within_15_min" | "within_1_hour" | "same_day" | "next_business_day" | "within_3_days" | "no_sla";
export type HomeownerDesiredTiming = "asap_today" | "next_24_48h" | "this_week" | "specific_day" | "flexible" | "exploring" | "UNKNOWN";
export type PreferredTimeOfDay = "morning" | "afternoon" | "evening" | "any" | "UNKNOWN";
export type NotificationChannel = "in_app" | "sms";
export type ClaimStage =
  | "claim_filed" | "adjuster_scheduled" | "estimate_received" | "supplement_filed"
  | "supplement_approved" | "in_production" | "completed" | "payment_collected";
export type SupplementStatus =
  | "not_needed" | "opportunity_flagged" | "filed" | "pending_response"
  | "approved" | "partially_approved" | "denied";
export type ActivityType =
  | "stage_change" | "note_added" | "field_updated" | "alert_generated"
  | "brief_linked" | "payment_recorded" | "claim_created";
export type ActivitySource = "system" | "contractor" | "ai";

export type Contractor = {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  company_name: string | null
  owner_name: string | null
  phone: string | null
  email: string
  twilio_phone_number: string | null
  retell_agent_id: string | null
  onboarding_completed: boolean
  timezone: string
}

export type Customer = {
  id: string
  created_at: string
  updated_at: string
  contractor_id: string
  name: string
  phone: string
  email: string | null
  property_address: string | null
  /** Most recent per-call preferred contact number. Not selected by
   * BRIEF_SELECT/CLAIM_SELECT's customers embed — add there if a screen
   * needs it. */
  preferred_contact_number: string | null
}

export type Transcript = {
  id: string
  created_at: string
  contractor_id: string
  customer_id: string
  retell_call_id: string | null
  caller_phone: string
  twilio_number: string | null
  duration_seconds: number | null
  transcript_text: string
  recording_url: string | null
  status: TranscriptStatus
  raw_metadata: Record<string, unknown>
  ai_model: string | null
  ai_input_tokens: number | null
  ai_output_tokens: number | null
  ai_cache_read_tokens: number | null
  ai_cost_usd: number | null
  ai_latency_ms: number | null
  preferred_contact_number: string | null
}

export type Brief = {
  id: string
  created_at: string
  updated_at: string
  contractor_id: string
  transcript_id: string
  customer_id: string
  damage_type: DamageType | null
  damage_description: string | null
  damage_severity: string | null
  interior_damage: boolean | null
  insurance_carrier: string | null
  has_filed_claim: boolean | null
  claim_number: string | null
  competitor_mentioned: boolean
  competitor_name: string | null
  competitor_scheduled: boolean
  competitor_timing: string | null
  lead_score: number | null
  estimated_value_low: number | null
  estimated_value_high: number | null
  urgency: UrgencyLevel | null
  appointment_probability: number | null
  recommended_action: string | null
  recommended_follow_up: string | null
  situation_summary: string | null
  suggested_opening: string | null
  risk_flags: string[]
  key_objections: string[]
  confidence_score: number | null
  data_completeness: number | null
  ai_model: string | null
  ai_raw_output: Record<string, unknown> | null
  status: BriefStatus
  status_updated_at: string | null
  notes: string | null
  notes_updated_at: string | null
  /** V2 Win Brief fields (Workflow 2, currently inactive). Null on
   * pre-V2 briefs — ~93% of rows as of Aug 13, 2026. Not read by any
   * Phase 2A/2B query yet; typed here for accuracy per source-of-truth
   * decision. See PHASE2_DATA_CONTRACT_ADDENDUM.md before consuming. */
  retell_call_summary: string | null
  qualification: Qualification | null
  contact_permission: ContactPermission | null
  competitor_status: CompetitorStatus | null
  response_sla: ResponseSla | null
  missing_fields: string[] | null
  homeowner_desired_timing: HomeownerDesiredTiming | null
  preferred_time_of_day: PreferredTimeOfDay | null
  adjuster_name: string | null
  adjuster_visit_date: string | null
  deductible_amount: number | null
  no_insurance: boolean | null
  homeowner_phone: string | null
  ai_raw_output_v2_shadow: Record<string, unknown> | null
  /** Data lineage — "seed", "organic_pipeline", etc. Used by dashboard
   * queries to exclude non-organic records from contractor-facing views. */
  provenance_source: string | null
}

/** Brief joined with the fields the Today/Win-Brief screens need from
 * customers and transcripts — one query, not a waterfall. */
export type BriefWithRelations = Brief & {
  customers: Pick<Customer, "name" | "phone" | "property_address"> | null
  transcripts: Pick<Transcript, "transcript_text" | "recording_url" | "created_at" | "duration_seconds"> | null
}

export type Notification = {
  id: string
  created_at: string
  contractor_id: string
  type: NotificationType
  title: string
  body: string | null
  link_type: string | null
  link_id: string | null
  channels_sent: NotificationChannel[]
  is_read: boolean
  read_at: string | null
}

export type Claim = {
  id: string
  created_at: string
  updated_at: string
  contractor_id: string
  brief_id: string | null
  customer_id: string
  insurance_carrier: string | null
  policy_number: string | null
  claim_number: string | null
  adjuster_name: string | null
  adjuster_phone: string | null
  adjuster_email: string | null
  damage_type: DamageType | null
  stage: ClaimStage
  stage_entered_at: string
  days_in_current_stage: number
  contractor_estimate: number | null
  insurance_estimate: number | null
  supplement_amount: number | null
  supplement_status: SupplementStatus
  final_approved_amount: number | null
  deductible_amount: number | null
  depreciation_holdback: number | null
  amount_paid: number
  amount_outstanding: number | null
  adjuster_meeting_date: string | null
  adjuster_meeting_reminder_sent: boolean
  adjuster_2hr_reminder_sent: boolean
  estimate_received_date: string | null
  supplement_filed_date: string | null
  supplement_resolved_date: string | null
  production_start_date: string | null
  completion_date: string | null
  final_payment_date: string | null
  is_stalled: boolean
  needs_attention: boolean
  stall_reason: string | null
  notes: string | null
  provenance_source: string | null
}

/** Claim joined with the customer fields the Pipeline/Claim Detail
 * screens need — same one-query pattern as BriefWithRelations. */
export type ClaimWithRelations = Claim & {
  customers: Pick<Customer, "name" | "phone" | "property_address"> | null
}

export type ClaimActivity = {
  id: string
  created_at: string
  claim_id: string
  contractor_id: string
  activity_type: ActivityType
  description: string
  old_value: string | null
  new_value: string | null
  source: ActivitySource
  metadata: Record<string, unknown>
}

/** Fields a contractor can edit inline from Claim Detail — everything
 * except identity/system columns (id, contractor_id, brief_id,
 * customer_id, stage_entered_at, days_in_current_stage,
 * amount_outstanding — the last one is trigger-computed, never a
 * direct write). Matches the Update type below exactly. */
export type EditableClaimFields = Partial<Pick<Claim,
  | "insurance_carrier" | "policy_number" | "claim_number"
  | "adjuster_name" | "adjuster_phone" | "adjuster_email"
  | "damage_type" | "stage"
  | "contractor_estimate" | "insurance_estimate" | "supplement_amount" | "supplement_status"
  | "final_approved_amount" | "deductible_amount" | "depreciation_holdback" | "amount_paid"
  | "adjuster_meeting_date"
  | "estimate_received_date" | "supplement_filed_date" | "supplement_resolved_date"
  | "production_start_date" | "completion_date" | "final_payment_date"
  | "notes"
>>

export type Database = {
  public: {
    Tables: {
      contractors: {
        Row: Contractor
        Insert: Partial<Contractor> & { user_id: string; email: string }
        Update: Partial<Pick<Contractor, 'company_name' | 'owner_name' | 'phone' | 'timezone'>>
        Relationships: []
      }
      customers: {
        Row: Customer
        Insert: Partial<Customer> & { contractor_id: string; name: string; phone: string }
        Update: Partial<Pick<Customer, 'name' | 'phone' | 'email' | 'property_address'>>
        Relationships: []
      }
      transcripts: {
        Row: Transcript
        Insert: Partial<Transcript>
        Update: Partial<Transcript>
        Relationships: []
      }
      briefs: {
        Row: Brief
        Insert: Partial<Brief>
        Update: Partial<Pick<Brief, 'status' | 'notes'>>
        Relationships: []
      }
      notifications: {
        Row: Notification
        Insert: Partial<Notification>
        Update: Partial<Pick<Notification, 'is_read' | 'read_at'>>
        Relationships: []
      }
      claims: {
        Row: Claim
        Insert: Partial<Claim> & { contractor_id: string; customer_id: string }
        // Full-CRUD update, unlike briefs — matches the migration's
        // deliberately different RLS grant for this table.
        Update: EditableClaimFields
        Relationships: []
      }
      claim_activities: {
        Row: ClaimActivity
        Insert: Partial<ClaimActivity> & { claim_id: string; contractor_id: string; activity_type: ActivityType; description: string }
        // Append-only — RLS grants select+insert only, no update at all.
        Update: Record<string, never>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
