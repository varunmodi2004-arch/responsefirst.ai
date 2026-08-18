# ResponseFirst — Phase 2: Authentication + Contractor Setup

Builds on Phase 1 (`contractors`, `customers`, `transcripts`, `briefs` +
the `handle_new_user` auto-provisioning trigger). This phase is the
Next.js app layer: Supabase Auth (Google + Magic Link), a login page,
route protection, and a thin dashboard placeholder that proves the
whole loop works end to end.

## Stack

- Next.js 16 (App Router, Turbopack, TypeScript, Tailwind v4)
- `@supabase/supabase-js` + `@supabase/ssr`

Next.js 16 renamed `middleware.ts` → `proxy.ts` (function `middleware`
→ `proxy`). A leftover `middleware.ts` is silently ignored — no build
error, route protection just quietly stops working. If you're
upgrading this project later and auth gating seems to have
disappeared, that's the first thing to check. See the comment at the
top of `proxy.ts`.

## Deliberate scope decisions (not oversights)

Both approved before this phase was built:

1. **No onboarding gate yet.** `contractors.onboarding_completed`
   defaults `false` for every new signup, but nothing currently checks
   it. Every successful login lands on `/dashboard` regardless. Phase 8
   will add the real onboarding wizard and, at that point, the redirect
   check into `app/dashboard/page.tsx` (or a new `layout.tsx` if the
   dashboard grows more than one route by then).
2. **No custom SMTP.** Magic Link runs on Supabase's default email
   sender, which is rate-limited to roughly 2–4 emails/hour — fine for
   solo testing, not for real customer onboarding. Switch to Resend
   (already planned for Phase 7's weekly reports, so no new vendor)
   before onboarding the first paying contractor. Supabase has a
   one-click Resend integration under Authentication → Providers → SMTP.

## What's already done at the database layer (Phase 1)

`handle_new_user()` creates a `contractors` row automatically the
instant someone signs up — this app never creates that row itself. All
this phase does is read it (`lib/contractor.ts`). If a login ever
lands on `/dashboard` with no contractor row, that's a Phase 1
database issue, not something to debug here.

## Setup

1. `cp .env.example .env.local` and fill in your Supabase project's URL
   and anon key (Project Settings → API).
2. **Google provider:** Google Cloud Console → OAuth 2.0 Client ID (Web
   application) → Authorized redirect URI =
   `https://<project-ref>.supabase.co/auth/v1/callback` → paste the
   Client ID/Secret into Supabase → Authentication → Providers → Google.
3. **Redirect URLs:** Supabase → Authentication → URL Configuration →
   add `http://localhost:3000/auth/callback` (dev) and
   `https://<your-domain>/auth/callback` (prod) to the allowlist.
4. `npm install`
5. `npm run dev`

## Verification checklist

Mirrors the architecture doc's Phase 2 acceptance tests exactly:

- [ ] Google OAuth: sign in, land on `/dashboard`
- [ ] Magic Link: request link, click it, land on `/dashboard`
- [ ] Query `contractors` after first sign-in — exactly one row, `email`
      populated, `company_name`/`owner_name`/`phone` null
- [ ] Sign in a second time — no duplicate contractor row
- [ ] Hit `/dashboard` logged out — redirected to `/login`
- [ ] Log in, refresh the page — session holds
- [ ] Sign up via Magic Link, then try Google with the same email —
      confirm Supabase links them to one account rather than erroring
      (this is the one edge case worth deliberately testing, not just
      assuming)

## File map

| File | Purpose |
|---|---|
| `lib/supabase/client.ts` | Browser Supabase client (Client Components) |
| `lib/supabase/server.ts` | Server Supabase client (Server Components, Route Handlers) |
| `lib/supabase/proxy.ts` | `updateSession()` — session refresh + route gating logic |
| `proxy.ts` | Root file Next.js 16 looks for; wires `updateSession()` into the request cycle |
| `lib/contractor.ts` | `getContractor()` — reads the caller's auto-provisioned row |
| `lib/database.types.ts` | Hand-written types matching the Phase 1 schema (replace with `supabase gen types typescript` once the CLI is linked) |
| `app/login/page.tsx` + `login-form.tsx` | Google + Magic Link sign-in UI |
| `app/auth/callback/route.ts` | Exchanges the OAuth/Magic-Link code for a session |
| `app/auth/signout/route.ts` | Signs out |
| `app/dashboard/page.tsx` | Placeholder — Phase 4 replaces this with the real Today screen |
