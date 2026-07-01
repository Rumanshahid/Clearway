# Clearway

AI-drafted prior authorization letters for US medical practices. Staff submit a case, Claude drafts an 8-component justification letter against Aetna/eviCore imaging criteria, staff review and approve, download as PDF.

This is **Phase 1** of the full build spec: Auth → Onboarding → PA intake form → Claude letter generation → Letter review/download → Basic request dashboard. Payoneer billing, the admin panel, and the HIPAA audit/retention layer are not built yet — see "What's not here yet" below.

## Stack

Next.js 16 (App Router) · Supabase (Postgres + Auth) · Anthropic API (Claude) · Tailwind v4 · `@react-pdf/renderer`

## Setup

1. **Supabase project** — create one at [supabase.com](https://supabase.com). In the SQL Editor, run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) once. Copy the Project URL, anon key, and service role key from Project Settings → API.
2. **Anthropic API key** — from [console.anthropic.com](https://console.anthropic.com/settings/keys). If you'll be sending real patient-adjacent data, confirm your account tier supports a BAA before going live — the app is built to never send real patient names (only de-identified references), but the BAA is still required for HIPAA compliance.
3. Copy `.env.example` to `.env.local` and fill in the four values above.
4. `npm install`
5. `npm run dev` — [http://localhost:3000](http://localhost:3000)

Email verification links and password-reset links use `NEXT_PUBLIC_SITE_URL` for their redirect — update it once you have a real domain, and add that URL under Supabase → Authentication → URL Configuration.

## How it's organized

- `src/lib/criteria.ts` — structured version of `PA-Criteria-Reference-Imaging-v1.pdf`: the 7 imaging procedures, their required intake fields, Aetna/eviCore criteria summaries, and red flags. This drives both the dynamic intake form and the Claude system prompt. Edit this file (not the PDF) to add procedures or update criteria — keep everything paraphrased, per the PDF's legal note.
- `src/lib/anthropic.ts` — builds the Claude system prompt from `criteria.ts` and the 8-component letter structure, calls the API.
- `src/app/dashboard/requests/new/actions.ts` — intake form submission, missing-field validation, and the letter-generation call.
- `src/app/dashboard/requests/[id]/` — letter review, inline edit, approve/lock, status tracker, PDF download.
- `supabase/migrations/0001_init.sql` — full schema + row-level security, scoped so each practice only sees its own data.

## What's not here yet (later phases, per the build spec)

- **Payoneer/Stripe billing** — plan selection during onboarding just records intent; nothing is charged. Confirm whether Payoneer supports recurring subscription billing via API before building this; Stripe is the documented fallback.
- **Admin panel** — practice management, criteria editor, prompt version history, revenue dashboard.
- **HIPAA layer** — the `access_log` table exists in the schema but isn't being written to yet; no auto-deletion/retention policy; no signed BAA acceptance flow during onboarding.
- **Email notifications** — Supabase sends its own auth emails (verification, password reset); there's no Resend/SendGrid integration yet for "letter ready," billing receipts, etc.
- **Google SSO, SMS notifications** — both explicitly marked optional/later in the spec.
