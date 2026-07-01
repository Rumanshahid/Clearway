# Clearway — Manual Setup Guide

Everything the code needs that only you can provide: accounts, API keys, and
one-time configuration. Follow in order — later steps depend on earlier ones.

Total time: roughly 45–60 minutes if you have all account credentials handy.

---

## 0. What you'll end up with

- A live app at your Vercel URL (or custom domain)
- A Supabase project holding all data (Postgres + Auth)
- Claude drafting letters via your Anthropic API key
- Paddle collecting real subscription payments
- Resend sending transactional email
- Your own account promoted to Super Admin

---

## 1. Supabase (database + auth)

1. Go to [supabase.com](https://supabase.com) → **New Project**.
   - Name: `clearway` (or anything)
   - Database password: generate and **save it somewhere** (password manager) — you won't need it day-to-day since the app uses API keys, but you'll want it if you ever need direct Postgres access.
   - Region: pick one close to your users (US region, since this is a US healthcare product).
2. Wait ~2 minutes for provisioning.
3. **Run the migrations** — Project → SQL Editor → New query. Run these files **in order**, one at a time, each as its own query (copy-paste the full file contents):
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_billing_admin.sql`
   - `supabase/migrations/0003_seed_criteria.sql`
   - `supabase/migrations/0004_seed_defaults.sql`
   - `supabase/migrations/0005_compliance_notifications.sql`

   Each should say "Success. No rows returned" (or similar). If one errors, stop and fix it before running the next — they depend on each other.
4. **Get your API keys** — Project Settings → API:
   - `Project URL` → this is `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → this is `SUPABASE_SERVICE_ROLE_KEY` — **never expose this to the browser**, it bypasses all row-level security.
5. **Email templates** (optional but recommended) — Authentication → Email Templates. Supabase's default confirmation/reset emails work out of the box; customize later if you want Clearway branding.
6. **Auth settings** — Authentication → URL Configuration:
   - Site URL: your production URL (set this after you deploy — placeholder for now, e.g. `http://localhost:3000`)
   - Redirect URLs: add `https://<your-vercel-domain>/auth/callback` and `http://localhost:3000/auth/callback` (you'll update the production one once you know your real domain).

---

## 2. Anthropic (Claude API)

1. Go to [console.anthropic.com](https://console.anthropic.com) → **Settings → API Keys** → Create Key.
   - This is `ANTHROPIC_API_KEY`.
2. **BAA (Business Associate Agreement) — do this before any real patient-adjacent data touches the app.** Not every Anthropic tier supports a BAA. Contact Anthropic sales/support to confirm your account tier is BAA-eligible and get one signed. Until that's done, only use de-identified test data (which the app already enforces by design — no real patient names are ever collected).
3. Model: the app defaults to `ANTHROPIC_MODEL=claude-sonnet-5`. Leave as-is unless you have a specific reason to change it.

---

## 3. Paddle (subscription billing)

Paddle, not Payoneer — Payoneer's "recurring payments" is a payout feature for paying vendors, not a way to charge your customers a subscription. Paddle also acts as merchant of record, so it handles sales tax/VAT for you.

1. Sign up at [paddle.com](https://www.paddle.com). Start in **Sandbox mode** (top-left toggle) — test the whole flow before going live.
2. **Create the Practice price**: Catalog → Products → New Product.
   - Name: "Clearway — Practice Plan"
   - Add a price: $249.00 USD, **Recurring**, **Monthly**.
   - Save, then copy the **Price ID** (starts with `pri_`) — this is `NEXT_PUBLIC_PADDLE_PRICE_ID_PRACTICE`.
3. **Get your client-side token**: Developer Tools → Authentication → Client-side tokens → create one for Sandbox.
   - This is `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`.
4. **Get your API key**: Developer Tools → Authentication → API keys → create one.
   - This is `PADDLE_API_KEY`.
5. **Set up the webhook** (do this *after* you've deployed to Vercel and know your real URL): Developer Tools → Notifications → New destination.
   - URL: `https://<your-domain>/api/webhooks/paddle`
   - Events to subscribe to: all `subscription.*` events and `transaction.completed`.
   - Save, then copy the **Notification signing secret** — this is `PADDLE_WEBHOOK_SECRET`.
6. `NEXT_PUBLIC_PADDLE_ENV=sandbox` for testing. Switch to `production` (and redo steps 2–5 in Paddle's live mode, which has separate IDs/keys) when you're ready for real customers.

---

## 4. Resend (transactional email)

1. Sign up at [resend.com](https://resend.com) → API Keys → Create.
   - This is `RESEND_API_KEY`.
2. **Verify a sending domain**: Domains → Add Domain → follow the DNS record instructions (add the TXT/CNAME records at your domain registrar). Takes a few minutes to a few hours to verify depending on DNS propagation.
3. Set `RESEND_FROM_EMAIL` to something on your verified domain, e.g. `Clearway <notifications@yourdomain.com>`.
4. Without a verified domain, Resend will only let you send to your own account's email — fine for testing, not for real users.
5. If you skip this entirely, the app doesn't break — it just logs emails to the server console instead of sending them (check `RESEND_API_KEY` is unset behavior in `src/lib/email.ts`).

---

## 5. Deploy to Vercel

If you haven't already pushed this repo to GitHub and imported it in Vercel:

1. Push the repo to GitHub (see the separate instructions I gave you in chat).
2. In the [Vercel dashboard](https://vercel.com/new), **Import** the GitHub repo under your team.
3. Framework preset: Next.js (auto-detected). Leave build settings default.
4. **Before the first deploy**, add every environment variable below (Project → Settings → Environment Variables). Set them for **Production**, **Preview**, and **Development** unless noted otherwise.

| Variable | Value source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase step 4 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase step 4 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase step 4 |
| `ANTHROPIC_API_KEY` | Anthropic step 1 |
| `ANTHROPIC_MODEL` | `claude-sonnet-5` |
| `NEXT_PUBLIC_SITE_URL` | Your Vercel URL, e.g. `https://clearway.vercel.app` (update after first deploy once you know it) |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | Paddle step 3 |
| `NEXT_PUBLIC_PADDLE_ENV` | `sandbox` or `production` |
| `NEXT_PUBLIC_PADDLE_PRICE_ID_PRACTICE` | Paddle step 2 |
| `PADDLE_API_KEY` | Paddle step 4 |
| `PADDLE_WEBHOOK_SECRET` | Paddle step 5 (add this *after* first deploy, once the webhook exists) |
| `RESEND_API_KEY` | Resend step 1 |
| `RESEND_FROM_EMAIL` | Resend step 3 |
| `CRON_SECRET` | Generate any random string yourself, e.g. run `openssl rand -hex 32` locally, or use a password generator. Vercel automatically sends this as the `Authorization: Bearer <value>` header to your cron route once the var exists. |

5. Deploy. First build takes 2–4 minutes.
6. Go back to Supabase (step 1.6) and Paddle (step 3.5) and fill in the real production URL now that you have it.

---

## 6. Become Super Admin

There's no UI for the very first admin, by design (nobody should be able to self-promote through the app).

1. Sign up for a normal account through your deployed app (`/sign-up`) — use your real email.
2. Go to Supabase → SQL Editor and run:
   ```sql
   update profiles set role = 'super_admin'
   where id = (select id from auth.users where email = 'your-email@example.com');
   ```
3. Sign out and back in. You'll now see the "Admin" nav when you visit `/admin/practices`.

---

## 7. End-to-end verification checklist

Work through this once everything above is set:

- [ ] Sign up → verification email arrives → click link → lands on `/onboarding`
- [ ] Complete onboarding (BAA checkbox required) → lands on `/dashboard`
- [ ] Create a PA request → Claude drafts a letter within a few seconds → no errors
- [ ] Download the letter as PDF → opens correctly
- [ ] Approve the letter → status moves to "Reviewed"
- [ ] `/dashboard/billing` → click Upgrade → Paddle sandbox checkout opens → complete with [Paddle's test card](https://developer.paddle.com/concepts/payment-methods/test-cards) → plan flips to "Practice" within a few seconds (webhook working)
- [ ] `/admin/practices` reachable only after Super Admin promotion; blocked (redirects to `/dashboard`) for a normal account
- [ ] `/admin/criteria` → disable a procedure → it disappears from the intake form dropdown
- [ ] Notification bell shows the "letter ready" notification after drafting

---

## 8. Before you take on a real (non-test) client

- [ ] Anthropic BAA signed (step 2.2) — do not process any real patient-adjacent data before this
- [ ] A healthcare/IP attorney has reviewed: the BAA text shown at onboarding, and the criteria paraphrasing approach (the PDF's own "Legal Note" section flags this)
- [ ] Paddle switched from sandbox to production mode, with production keys/price ID
- [ ] Custom domain connected (Vercel → Domains) instead of the `.vercel.app` URL
- [ ] Resend domain fully verified (not just added)
- [ ] Walk through the retention policy (`/admin/practices/[id]`, default 12 months) with your first real client and confirm it matches what you told them
