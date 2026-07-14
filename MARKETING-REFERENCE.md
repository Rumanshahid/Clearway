# asaanbil.com — Marketing Reference Document

*A complete, factual reference to everything the product does — for building ads, landing pages, sales decks, social posts, and outreach. Everything below reflects what is actually built and live in the product, not aspirational copy. Where a claim needs a source, the source is noted.*

---

## 1. One-line positioning

**asaanbil.com is the AI front office for specialty medical practices** — it drafts prior authorization letters and claim appeals citing the exact criteria each payer checks for, runs your patient booking calendar end to end, and keeps your whole front desk working from one dashboard instead of four different logins.

It started as a prior-authorization letter-drafting tool and has grown into a full practice-operations platform. Prior auth is still the flagship, most differentiated capability — but it is one of four pillars now, not the whole product.

---

## 2. Current live homepage copy (asaanbil.com)

Use this verbatim, or as raw material — it's the actual copy shipped on the site today.

### Hero
- **Eyebrow:** AI for Practice Operations
- **Headline:** Stop losing hours to paperwork that isn't patient care.
- **Subheadline:** asaanbil.com drafts prior authorization letters and claim appeals citing the exact criteria each payer checks for, runs your booking calendar end to end, and keeps your whole front desk working from one dashboard — not four different logins.
- **Primary CTA:** Start Free Pilot
- **Secondary CTA:** See How It Works
- **Trust bullets:** No EHR migration · Human reviews every draft · HIPAA-ready

### Stats (sourced)
| Stat | Label | Detail |
|---|---|---|
| 13 | Hours Lost Weekly | Per physician, per week, spent on prior authorizations. *(AMA, 2024)* |
| 89% | Rising Denials | Of hospital systems report rising claim denials, driven mainly by prior auth. |
| 82% | Approval Rate | When letters explicitly cite CPB criteria, versus unstructured submissions. |

### The Platform (4 pillars)
**Eyebrow:** The Platform · **Headline:** One system for the paperwork that isn't patient care.
**Intro:** asaanbil.com started with prior authorization. It now runs the rest of your front office too — same login, same dashboard.

1. **Prior Authorization** — Draft letters citing the exact medical-necessity criteria each payer checks for, with missing documentation flagged before you submit.
2. **Claims & Appeals** — Log denials, auto-fill the form straight from an uploaded EOB, and get an AI-drafted appeal letter with the deadline already on the calendar.
3. **Scheduling & Booking** — Patients book their own slot from your public profile, get reminders automatically, and a thank-you note goes out after every visit — no front-desk phone tag.
4. **Team & Patients** — Invite staff with role-based access, track your patient roster and eligibility checks, and run it all from one dashboard you can rearrange to fit how your practice works.

### How Prior Authorization Works (3 steps)
1. **Intake — enter the case.** Staff fills a short intake form — diagnosis, exam findings, conservative treatment already tried. Under three minutes.
2. **Draft — asaanbil.com writes it.** Matched against the payer's exact published medical necessity criteria. Missing fields are flagged before submission, not after a denial.
3. **Review — sign and send.** A physician reads the draft, edits as needed, and submits as usual. asaanbil.com drafts — your clinic decides.

### Payer Coverage — "We only cover what we can get right."
Seven major payers, each mapped to the specific standard their own reviewers check against — not one generic template stretched across all of them.

| Payer | What's actually cited |
|---|---|
| **Aetna** | 800+ Clinical Policy Bulletins, publicly available. Imaging criteria reference the exact CPB clause reviewers check for. |
| **Cigna / eviCore** | eviCore manages imaging PA for Cigna and several delegated plans — one criteria set, multiple insurers. |
| **UnitedHealthcare** | UHC's InterQual criteria are proprietary, so we cite ACR Appropriateness Criteria instead — the standard their own reviewers accept. |
| **Humana** | Medicare Advantage cites CMS coverage rules directly; commercial Humana cites ACR criteria in place of Humana's proprietary MCG system. |
| **Anthem / Elevance (BCBS)** | Imaging/MSK routes through Carelon, specialty cases through eviCore — we cite the right guideline for whichever track applies. |
| **Molina Healthcare** | State Medicaid coverage policy plus ACR Appropriateness Criteria, with the real state-specific timely-filing window built in. |
| **Medicare (Traditional / FFS)** | Cited against CMS's own National and Local Coverage Determinations — exactly what a MAC reviewer checks against. |

### Before → After (comparison carousel)
1. Letters took 30–45 minutes, written from scratch every time — asaanbil.com now drafts one in **under 10 minutes**.
2. Staff used to guess which clause a payer wanted — asaanbil.com now **cites the exact one automatically**.
3. A denied claim sat in a drawer until someone remembered the deadline — asaanbil.com now **tracks every appeal deadline automatically**.
4. New patients played phone tag for days to get on the calendar — asaanbil.com now **lets them book their own slot in under a minute**.

### Pricing — "Earn a place before charging for it."
*Start with a free pilot. No setup fees, no contracts, no salespeople chasing you down.*

| Plan | Price | Includes |
|---|---|---|
| **Pilot** | Free — first 10 letters, no card required | 10 prior auth drafts included · De-identified test cases · Direct line to the founder |
| **Practice** *(Most Popular)* | **$249/mo** — single-location practice | Unlimited letter drafts · Aetna + Cigna/eviCore coverage *(bullet predates the 7-payer expansion — update to "all 7 major payers")* · Missing-field flags before submit · Request tracking dashboard |
| **Multi-Site** | Custom — groups & multi-location practices | Volume-based pricing · Extra payer criteria on request · Dedicated onboarding |

Multi-Site is sales-assisted only (`hello@asaanbil.com`), not self-serve.

### Final CTA
**Headline:** Bring us your busiest week.
**Copy:** Prior auth, claims, scheduling — we'll show you what changes before you commit to anything.
**Button:** Request a Free Pilot

### About page (brand voice reference)
- **Headline:** Built by people tired of watching good care get stuck in paperwork.
- **Why we started:** "The letter was never the hard part." — every clinic had the clinical judgment right; writing it up in the exact structure/citation a payer reviewer expects was the bottleneck.
- **How we work:** Match every case to real criteria (not generic templates) → flag what's missing before it becomes a denial → a human always has the final word.
- **What we believe:** *"We'd rather tell you honestly when a payer has no published criteria for a case than pretend we found a citation that isn't really there."*
- **Positioning:** *"Starting narrow, on purpose"* — coverage grows once validated against real submissions, not before.

**Tone to preserve in all marketing material:** plainspoken, concrete, low-hype, explicitly honest about limitations. Never oversell. This is a deliberate trust-building choice for a skeptical clinical/administrative buyer — don't write copy that sounds like a typical over-promising health-tech vendor.

---

## 3. Full feature list by module

### Prior Authorization (the flagship)
- Dynamic intake form per procedure (diagnosis, exam findings, conservative treatment tried, prior imaging, etc.)
- Claude drafts an 8-section structured letter: demographics, diagnosis, procedure description, payer policy citation, clinical rationale, prior treatment history, duration, ordering physician
- Every letter comes with a `denialRiskAssessment` (Low/Medium/High + reason) and flags for missing documentation — never invents what's missing
- "Authoring mode" toggle: doctor's voice (standard) or patient's own first-person voice (for patient-filed appeals)
- Full review → edit → approve workflow before anything is submitted
- One-click PDF download of the finished letter
- Every view/create/download/approve/status-change/redraft/delete logged to an audit trail

### Claims & Appeals
- Log claim denials: claim number, denial date/reason code, payer, amount billed/denied/recovered, appeal deadline, status, priority
- **AI EOB parser** — upload the Explanation of Benefits PDF, Claude extracts the fields and auto-fills the denial-logging form
- AI-drafted 8-section claim-appeal letter: claim ID, service/diagnosis, denial addressed, policy citation, new evidence, supporting docs, requested action, signature
- Month-to-date denied/recovered dollar totals surfaced automatically
- Downloadable as PDF

### Patients
- Full patient roster (name, DOB, insurance company, member ID, status)
- Bulk CSV import with import/skip/error reporting
- Insurance eligibility check logging, with staleness tracking that feeds directly into letter drafting (a stale eligibility check gets flagged in the AI prompt)

### Scheduling & Booking
- Internal calendar/board view per doctor (confirmed / checked-in / complete / no-show / cancelled)
- Waitlist system + appointment analytics
- Automated appointment-reminder cron job
- **Public booking flow** — an anonymous visitor picks reason for visit, duration, telehealth vs. in-person, and books a real open slot (deterministic slot engine, not AI-guessed)
- Confirmation emails to patient and doctor, automatic telehealth room creation, optional insurance eligibility check on booking
- **AI-drafted "thank you" emails** after every visit — short, warm, and explicitly forbidden from inventing medical advice or mentioning cost/billing/insurance

### Team & Collaboration
- Invite staff by email, assign role (admin or staff) and per-user section access (requests / patients / appeals)
- Security-hardened invite links (built to survive link-preview crawlers/corporate "Safe Links" scanners without burning the one-time token)
- Internal team chat
- Shared tasks/to-do board with calendar view
- Doctor profile management (public booking presence, working hours, blackout dates)

### Resources (built-in reference tool)
- Denial-reason → correct-response → key-action table (13 common denial codes)
- Appeal-deadline-by-payer table (all 7 payers — imaging reviewer, standard/expedited timelines, peer-to-peer availability, external review path)
- Sourced, cited reference notes (see Section 5)

### Dashboard Overview
- Fully customizable widget dashboard — reorder or hide any panel
- Widgets: PA Requests, Patients, Appeals, Plan usage, Today's Schedule (real appointments, color-coded), Needs Attention (aggregated action items), Staff roster

### Admin panel (practice/org management)
- Manage all practices, plans, billing status
- Manage all users, roles, password resets
- Enable/disable which procedures staff can select
- CMS-style editor for every piece of public marketing copy (this document's Section 2 is fully editable there)
- Version-controlled Claude prompt editor with activate/rollback
- Revenue/billing events feed
- HIPAA-style audit-log viewer

### Public Doctor Directory
- Searchable directory (`/doctors`) — filter by specialty, insurance accepted, language, city, accepting-new-patients, telehealth
- Each doctor's profile links directly into the booking flow

---

## 4. Payer & procedure coverage (for depth/proof-of-substance claims)

**7 payers**, each with a real citation strategy: Aetna, Cigna/eviCore, UnitedHealthcare, Humana, Anthem/Elevance (BCBS), Molina Healthcare, Medicare (Traditional/FFS).

**40 procedures supported out of the box**, spanning:
- **Imaging:** Lumbar/Cervical/Brain/Hip-Pelvis MRI, Knee MRI, Shoulder MRI, CT Abdomen/Pelvis, CT Chest, CT Spine, PET Scan, Nuclear Cardiology/Stress Imaging
- **Surgery:** Lumbar Spinal Fusion, Total Knee/Hip Arthroplasty, Knee Arthroscopy, Rotator Cuff Repair, ACDF (Cervical Fusion), TAVR, Bariatric Surgery
- **Pain management:** Epidural Steroid Injection, Facet Joint Injection/Medial Branch Block, Radiofrequency Ablation, Spinal Cord Stimulator Trial & Implant
- **Therapy:** Physical Therapy, Occupational Therapy, Speech-Language Pathology, Cardiac Rehabilitation
- **Specialty drugs:** TNF-Alpha Inhibitors (Humira, Enbrel, Remicade), IL Inhibitors (Dupixent, Cosentyx), Oncology Targeted Therapy (Keytruda, Herceptin), PCSK9 Inhibitors (Repatha, Praluent), GLP-1 Agonists (Ozempic, Wegovy, Mounjaro)
- **DME / home & institutional care:** CPAP/BiPAP, Power Wheelchair, Home Oxygen, Inpatient Psychiatric Admission, ABA Therapy, Home Health, SNF Admission, Hospice

**Marketing stat to use:** *"7 major payers, 40 procedures, mapped and live — not a generic template stretched thin."*

---

## 5. Security & compliance (what's real, not just claimed)

Actually built and enforceable:
- **Signed BAA required at onboarding** — a real checkbox/acceptance step before setup completes, timestamped and stored (`baa_accepted_at`/`baa_accepted_by`)
- **Row-Level Security at the database layer** — practice data isolation enforced by Postgres policies, not just app-code checks
- **Full audit trail** — every view/create/download/approve/status-change/redraft/delete on PA requests, letters, patients, and claim denials is logged (who, what, when), independent of the record itself so it survives data retention purges
- **Configurable data retention** — a daily automated job purges PA requests/letters past each practice's configured retention window, while the audit trail itself is retained
- **Role-based access** — admin vs. staff, with per-staff-member section-level permissions, enforced server-side (not just hidden in the UI)
- **PHI-aware AI prompting** — the letter-drafting prompt explicitly instructs the model to treat every identity field as PHI, use exactly what's given, and never guess or carry it elsewhere
- **BAA with Anthropic** — the company's own BAA with Anthropic (the AI provider) is referenced directly in the practice-facing BAA text

**Marketing-safe framing:** "HIPAA-ready" and "HIPAA-minded" are defensible summary claims backed by the above. **Do not** claim SOC 2 certification, a specific encryption standard (e.g. "AES-256"), penetration testing, or multi-factor authentication — none of these are confirmed/built as named features. Encryption at rest/in transit is inherited from the infrastructure stack (Supabase/Vercel), not a bespoke claim to make.

---

## 6. Proof points & sources (cited, for compliance-safe claims)

- Kaiser Family Foundation's analysis of Medicare Advantage prior-authorization data — a large majority of appealed denials are ultimately overturned.
- CMS's Interoperability and Prior Authorization Final Rule (CMS-0057-F, effective January 2024) — source of the 7-day standard / 72-hour expedited decision timelines.
- American Medical Association's prior-authorization physician survey (source of the "13 hours lost weekly" stat).
- Independent third-party analysis of UnitedHealthcare appeals — meaningfully higher overturn rates when appeals cite specific payer criteria point-by-point vs. arguing generally.
- American Hospital Association reporting on payer denial patterns and appeal spend.
- American College of Radiology Appropriateness Criteria — the standard cited when a payer has no dedicated policy.

**Caveat:** these are paraphrased summaries of real sources, not exact republished percentages (except the 3 homepage stats, which carry their own inline attribution). Don't present them as direct quotes from KFF/CMS/AMA/AHA.

---

## 7. Target customer (who to write ads/copy for)

**Primary buyer:** a doctor or practice administrator at a **solo-to-small-group specialty practice** (1–2 locations), evaluating and paying for the tool themselves — not enterprise procurement.

**Day-to-day user:** front-desk/clinical support staff who do the actual intake, letter drafting, and claim logging.

**Specialty skew (highest-value verticals given the procedure list):** orthopedics, spine, pain management, cardiology — imaging- and procedure-heavy specialties where prior-auth volume and denial pain are worst.

**Go-to-market motion:** founder-led, high-touch pilot ("bring us your next 10 prior authorizations," no card required, direct line to the founder) — not a self-serve enterprise sale.

**What resonates with this buyer:** concrete time/dollar savings, honesty about limitations, no EHR migration required, a free no-risk pilot — not hype, not vague AI buzzwords.

---

## 8. Ready-to-use headline + description pairs

1. **Stop losing hours to paperwork that isn't patient care.** — asaanbil.com drafts prior auth letters and claim appeals, runs your booking calendar, and keeps your whole front desk on one dashboard.
2. **Prior authorization, drafted in minutes — not hours.** — Letters cite the exact medical-necessity criteria each of 7 major payers checks for, with missing documentation flagged before you submit.
3. **Every denial, every deadline, tracked automatically.** — Log a denial, upload the EOB, and get an AI-drafted appeal letter with the deadline already on your calendar.
4. **Let patients book their own appointment — in under a minute.** — A public booking page for every doctor, with automatic reminders and a thank-you note after every visit.
5. **One dashboard for prior auth, claims, scheduling, and your team.** — Everything your front desk touches, in a single login, not four different tools.
6. **The letter was never the hard part. The paperwork was.** — asaanbil.com turns your own clinical findings into a properly cited, payer-ready letter in the time it takes to fill out a short form.
7. **Built for the specialties that fight prior auth the most.** — Orthopedics, spine, pain management, cardiology — 40 procedures and 7 major payers supported out of the box.
8. **A free pilot, not a sales pitch.** — Bring us your next 10 prior authorizations. No card required, no contract.
9. **Cite the exact clause a reviewer is checking for.** — Aetna, Cigna/eviCore, UnitedHealthcare, Humana, Anthem, Molina, and Medicare — each mapped to the real standard their reviewers use.
10. **HIPAA-minded from the first login.** — A signed BAA, role-based access, and a full audit trail on every request — built in, not bolted on.

---

## 9. Known gaps (don't invent copy to fill these)

- **No FAQ section exists yet** on the marketing site — write one fresh if needed, don't imply one already exists.
- **No testimonials/case studies exist yet** — the product is pilot-stage; don't fabricate customer quotes or logos.
- **No SOC 2, named encryption standard, or MFA claim** should be made (see Section 5).
- The Practice-plan pricing card still says "Aetna + Cigna/eviCore coverage" as a feature bullet — this predates the 7-payer expansion and should be updated to reflect all 7 payers (flagged here, not yet fixed on the live pricing card).
