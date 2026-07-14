// Single source of truth for every editable marketing-copy field across the
// public site. Both the admin editor (renders fields per page, validates
// which keys a save is allowed to touch) and the page components themselves
// (fall back to these defaults when no override has been saved yet) read
// from this file, so the two can never drift out of sync.

export interface ContentFieldDef {
  key: string;
  label: string;
  type?: "text" | "textarea";
  default: string;
}

export interface ContentSectionDef {
  title: string;
  // Present only for sections that can be hidden entirely on the live page.
  visibilityKey?: string;
  fields: ContentFieldDef[];
}

export interface ContentPageDef {
  slug: string;
  label: string;
  // Public paths to revalidate after a save. Defaults to `/${slug}` (or "/"
  // for "home") when omitted — only needs to be set explicitly for content
  // that appears on more than one route, like the shared nav bar.
  revalidatePaths?: string[];
  sections: ContentSectionDef[];
}

export const CONTENT_PAGES: ContentPageDef[] = [
  {
    slug: "nav",
    label: "Navigation",
    revalidatePaths: ["/", "/about"],
    sections: [
      {
        title: "Logo & links",
        fields: [
          { key: "nav_logo_text", label: "Logo text", default: "asaanbil.com" },
          { key: "nav_link_how", label: "\"How It Works\" link label", default: "How It Works" },
          { key: "nav_link_coverage", label: "\"Coverage\" link label", default: "Coverage" },
          { key: "nav_link_pricing", label: "\"Pricing\" link label", default: "Pricing" },
          { key: "nav_link_about", label: "\"About\" link label", default: "About" },
        ],
      },
      {
        title: "Auth buttons",
        fields: [
          { key: "nav_signin_label", label: "Sign In button text", default: "Sign In" },
          { key: "nav_signup_label", label: "Sign Up button text", default: "Sign Up" },
        ],
      },
    ],
  },
  {
    slug: "home",
    label: "Home",
    sections: [
      {
        title: "Hero",
        fields: [
          { key: "hero_tag", label: "Eyebrow tag", default: "AI-Powered Prior Authorization" },
          { key: "hero_headline", label: "Headline", type: "textarea", default: "Stop writing the same letter forty times a week." },
          {
            key: "hero_subheadline",
            label: "Subheadline",
            type: "textarea",
            default:
              "asaanbil.com drafts prior authorization letters from your chart notes — citing the exact medical necessity criteria each payer requires — in minutes, not hours.",
          },
          { key: "hero_cta_primary", label: "Primary CTA text", default: "Start Free Pilot" },
          { key: "hero_cta_secondary", label: "Secondary CTA text", default: "See How It Works" },
          { key: "hero_meta_1", label: "Trust bullet 1", default: "No EHR migration" },
          { key: "hero_meta_2", label: "Trust bullet 2", default: "Human reviews every letter" },
          { key: "hero_meta_3", label: "Trust bullet 3", default: "HIPAA-ready" },
        ],
      },
      {
        title: "Stats section",
        visibilityKey: "section_stats",
        fields: [
          { key: "stat1_number", label: "Stat 1 number", default: "13" },
          { key: "stat1_label", label: "Stat 1 label", default: "Hours Lost Weekly" },
          { key: "stat1_copy", label: "Stat 1 copy", type: "textarea", default: "Per physician, per week, spent on prior authorizations. (AMA, 2024)" },
          { key: "stat2_number", label: "Stat 2 number", default: "89%" },
          { key: "stat2_label", label: "Stat 2 label", default: "Rising Denials" },
          { key: "stat2_copy", label: "Stat 2 copy", type: "textarea", default: "Of hospital systems report rising claim denials, driven mainly by prior auth." },
          { key: "stat3_number", label: "Stat 3 number", default: "82%" },
          { key: "stat3_label", label: "Stat 3 label", default: "Approval Rate" },
          { key: "stat3_copy", label: "Stat 3 copy", type: "textarea", default: "When letters explicitly cite CPB criteria, versus unstructured submissions." },
        ],
      },
      {
        title: "How It Works",
        fields: [
          { key: "how_eyebrow", label: "Eyebrow", default: "How It Works" },
          { key: "how_h2", label: "Headline", default: "From chart note to letter, in three steps." },
          {
            key: "how_intro",
            label: "Intro paragraph",
            type: "textarea",
            default: "No new system to learn. No EHR migration. Your staff works the same way — just without the blank page and the guesswork.",
          },
          { key: "how_step1_title", label: "Step 1 title", default: "Intake — enter the case" },
          { key: "how_step1_desc", label: "Step 1 description", type: "textarea", default: "Staff fills a short intake form — diagnosis, exam findings, conservative treatment already tried. Under three minutes." },
          { key: "how_step2_title", label: "Step 2 title", default: "Draft — asaanbil.com writes it" },
          { key: "how_step2_desc", label: "Step 2 description", type: "textarea", default: "Matched against the payer's exact published medical necessity criteria. Missing fields are flagged before submission, not after a denial." },
          { key: "how_step3_title", label: "Step 3 title", default: "Review — sign and send" },
          { key: "how_step3_desc", label: "Step 3 description", type: "textarea", default: "A physician reads the draft, edits as needed, and submits as usual. asaanbil.com drafts — your clinic decides." },
        ],
      },
      {
        title: "Payer coverage section",
        visibilityKey: "section_insurers",
        fields: [
          { key: "insurers_eyebrow", label: "Eyebrow", default: "Payer Coverage" },
          { key: "insurers_h2", label: "Headline", default: "We only cover what we can get right." },
          {
            key: "insurers_intro",
            label: "Intro paragraph",
            type: "textarea",
            default: "Seven major payers, each mapped to the specific standard their own reviewers check against — not one generic template stretched across all of them.",
          },
          { key: "insurer1_name", label: "Card 1 name", default: "Aetna" },
          { key: "insurer1_desc", label: "Card 1 description", type: "textarea", default: "800+ Clinical Policy Bulletins, publicly available and mapped into asaanbil.com. Imaging criteria all reference the exact CPB clause reviewers check for." },
          { key: "insurer2_name", label: "Card 2 name", default: "Cigna / eviCore" },
          { key: "insurer2_desc", label: "Card 2 description", type: "textarea", default: "eviCore manages imaging PA for Cigna and several delegated plans. Public clinical guidelines mapped into asaanbil.com — one criteria set, multiple insurers." },
          { key: "insurer3_name", label: "Card 3 name", default: "UnitedHealthcare" },
          { key: "insurer3_desc", label: "Card 3 description", type: "textarea", default: "UHC's InterQual criteria are proprietary, so we cite the ACR Appropriateness Criteria standard their own reviewers accept instead — mapped and live on every UHC request." },
          { key: "insurer4_name", label: "Card 4 name", default: "Humana" },
          { key: "insurer4_desc", label: "Card 4 description", type: "textarea", default: "Medicare Advantage requests cite CMS coverage rules directly; commercial Humana plans cite ACR criteria in place of Humana's proprietary MCG system." },
          { key: "insurer5_name", label: "Card 5 name", default: "Anthem / Elevance (BCBS)" },
          { key: "insurer5_desc", label: "Card 5 description", type: "textarea", default: "Imaging and MSK cases route through Carelon, specialty cases through eviCore — asaanbil.com cites the right guideline for whichever track your case falls under." },
          { key: "insurer6_name", label: "Card 6 name", default: "Molina Healthcare" },
          { key: "insurer6_desc", label: "Card 6 description", type: "textarea", default: "State Medicaid coverage policy plus ACR Appropriateness Criteria, with your state's actual timely-filing window built in — not a generic 30-day guess." },
          { key: "insurer7_name", label: "Card 7 name", default: "Medicare (Traditional / FFS)" },
          { key: "insurer7_desc", label: "Card 7 description", type: "textarea", default: "Cited against CMS's own National and Local Coverage Determinations — exactly what a MAC reviewer checks your request against." },
        ],
      },
      {
        title: "Comparison carousel",
        visibilityKey: "section_compare",
        fields: [
          { key: "compare_eyebrow", label: "Eyebrow", default: "The Difference" },
          { key: "compare_h2", label: "Headline", default: "What changes for your front desk." },
          { key: "cmp1_before", label: "Slide 1 — before", type: "textarea", default: "Letters took 30–45 minutes, written from scratch every time — asaanbil.com now drafts one in " },
          { key: "cmp1_em", label: "Slide 1 — emphasized phrase", default: "under 10 minutes" },
          { key: "cmp1_after", label: "Slide 1 — after", default: "." },
          { key: "cmp2_before", label: "Slide 2 — before", type: "textarea", default: "Staff used to guess which clause a payer wanted — asaanbil.com now " },
          { key: "cmp2_em", label: "Slide 2 — emphasized phrase", default: "cites the exact one" },
          { key: "cmp2_after", label: "Slide 2 — after", default: " automatically." },
          { key: "cmp3_before", label: "Slide 3 — before", type: "textarea", default: "Denials surfaced weeks later, after care was delayed — asaanbil.com now " },
          { key: "cmp3_em", label: "Slide 3 — emphasized phrase", default: "flags the risk before you submit" },
          { key: "cmp3_after", label: "Slide 3 — after", default: "." },
          { key: "cmp4_before", label: "Slide 4 — before", type: "textarea", default: "Missing docs were found after rejection — asaanbil.com now " },
          { key: "cmp4_em", label: "Slide 4 — emphasized phrase", default: "tracks every request" },
          { key: "cmp4_after", label: "Slide 4 — after", default: " end to end." },
        ],
      },
      {
        title: "Pricing section",
        visibilityKey: "section_pricing",
        fields: [
          { key: "pricing_eyebrow", label: "Eyebrow", default: "Pricing" },
          { key: "pricing_h2", label: "Headline", default: "Earn a place before charging for it." },
          { key: "pricing_intro", label: "Intro paragraph", type: "textarea", default: "Start with a free pilot. No setup fees, no contracts, no salespeople chasing you down." },
          { key: "pricing_pilot_price", label: "Pilot price", default: "Free" },
          { key: "pricing_pilot_sub", label: "Pilot subtext", default: "First 10 letters, no card required" },
          { key: "pricing_pilot_cta", label: "Pilot button text", default: "Start Pilot" },
          { key: "pricing_practice_price", label: "Practice price", default: "$249" },
          { key: "pricing_practice_sub", label: "Practice subtext", default: "Single-location practice" },
          { key: "pricing_practice_cta", label: "Practice button text", default: "Get Started" },
          { key: "pricing_multisite_price", label: "Multi-Site price", default: "Custom" },
          { key: "pricing_multisite_sub", label: "Multi-Site subtext", default: "Groups & multi-location practices" },
          { key: "pricing_multisite_cta", label: "Multi-Site button text", default: "Talk to Us" },
        ],
      },
      {
        title: "Final CTA",
        fields: [
          { key: "cta_final_headline", label: "Headline", default: "Bring us your next 10 prior authorizations." },
          { key: "cta_final_copy", label: "Copy", default: "We'll show you what changes before you commit to anything." },
          { key: "cta_final_button", label: "Button text", default: "Request a Free Pilot" },
        ],
      },
    ],
  },
  {
    slug: "about",
    label: "About",
    sections: [
      {
        title: "Hero",
        fields: [
          { key: "about_hero_tag", label: "Eyebrow tag", default: "About Us" },
          { key: "about_hero_headline", label: "Headline", type: "textarea", default: "Built by people tired of watching good care get stuck in paperwork." },
          {
            key: "about_hero_copy",
            label: "Paragraph",
            type: "textarea",
            default: "asaanbil.com exists because prior authorization takes longer than it should, and the people paying for that delay are almost never the ones filling out the form.",
          },
        ],
      },
      {
        title: "Why We Started",
        fields: [
          { key: "about_why_eyebrow", label: "Eyebrow", default: "Why We Started" },
          { key: "about_why_h2", label: "Headline", default: "The letter was never the hard part." },
          {
            key: "about_why_p1",
            label: "Paragraph 1",
            type: "textarea",
            default:
              "Every clinic we talked to described the same pattern: a physician or a member of their staff knew exactly why a procedure was needed, but writing it up in the specific structure and language a payer reviewer expects — the right heading, the right citation, the right level of clinical detail — ate up time that should have gone to patients. The clinical judgment was never in question. The paperwork was the bottleneck.",
          },
          {
            key: "about_why_p2",
            label: "Paragraph 2",
            type: "textarea",
            default:
              "We built asaanbil.com to close that specific gap — not to replace clinical decision-making, but to turn a clinician's own findings into a properly structured, criteria-backed letter in the time it takes to fill out a short form.",
          },
        ],
      },
      {
        title: "How We Work",
        fields: [
          { key: "about_how_eyebrow", label: "Eyebrow", default: "How We Work" },
          { key: "about_how_h2", label: "Headline", default: "Structured, cited, and always reviewed by a human." },
          { key: "about_how_step1_title", label: "Step 1 title", default: "We match every case to real criteria" },
          { key: "about_how_step1_desc", label: "Step 1 description", type: "textarea", default: "Letters are drafted against payer medical-necessity criteria we keep on file for each procedure and payer combination — not generic templates." },
          { key: "about_how_step2_title", label: "Step 2 title", default: "We flag what's missing, before it becomes a denial" },
          { key: "about_how_step2_desc", label: "Step 2 description", type: "textarea", default: "If a case is missing the documentation a payer typically expects, we say so plainly rather than papering over the gap." },
          { key: "about_how_step3_title", label: "Step 3 title", default: "A human always has the final word" },
          { key: "about_how_step3_desc", label: "Step 3 description", type: "textarea", default: "Every letter is a draft until your staff reviews, edits, and approves it. We write the first version — your clinic decides what actually gets submitted." },
          { key: "about_how_belief_eyebrow", label: "\"What we believe\" eyebrow", default: "What we believe" },
          {
            key: "about_how_belief_copy",
            label: "\"What we believe\" copy",
            type: "textarea",
            default:
              "Prior authorization exists to check that care fits the evidence — we think that check should be fast and legible, not a source of delay in its own right. We'd rather build a tool that makes a clinician's existing judgment easy to document well, than one that tries to replace that judgment. And we'd rather tell you honestly when a payer has no published criteria for a case than pretend we found a citation that isn't really there.",
          },
        ],
      },
      {
        title: "Where We're Headed",
        fields: [
          { key: "about_headed_eyebrow", label: "Eyebrow", default: "Where We're Headed" },
          { key: "about_headed_h2", label: "Headline", default: "Starting narrow, on purpose." },
          {
            key: "about_headed_copy",
            label: "Paragraph",
            type: "textarea",
            default:
              "We launched with imaging prior authorizations for the payers where genuinely public, citable criteria exist — because a tool that cites real criteria for two payers is worth more than one that guesses at all of them. Coverage grows as we validate each addition against real submissions, not before.",
          },
        ],
      },
      {
        title: "Final CTA",
        fields: [
          { key: "about_cta_headline", label: "Headline", default: "Bring us your next 10 prior authorizations." },
          { key: "about_cta_copy", label: "Copy", default: "We'll show you what changes before you commit to anything." },
          { key: "about_cta_button", label: "Button text", default: "Start Free Pilot" },
        ],
      },
    ],
  },
  // The six pages below are logged-in app screens, not marketing pages —
  // they're built around live data (real patients, real claims, real
  // billing state), so only their framing text is exposed here: heading,
  // subtitle, primary button label, empty-state message. Column headers,
  // stat labels, and section titles stay hardcoded since they're tied to
  // real navigation/structure, not copy a marketer would tweak — renaming
  // a stat card without also changing what it measures would just be
  // confusing. Resources' actual denial-reason/deadline reference tables
  // stay data-file-driven on purpose: that's factual payer/regulatory
  // information, not something to expose to a plain-text-box edit.
  {
    slug: "dashboard",
    label: "Dashboard",
    revalidatePaths: ["/dashboard/overview"],
    sections: [
      {
        title: "Heading",
        fields: [
          { key: "dashboard_h1", label: "Page title", default: "Practice overview" },
          { key: "dashboard_subtitle", label: "Subtitle", default: "Everything happening across your practice, in one place." },
        ],
      },
    ],
  },
  {
    slug: "pa",
    label: "PA",
    revalidatePaths: ["/dashboard"],
    sections: [
      {
        title: "Heading",
        fields: [
          { key: "pa_h1", label: "Page title", default: "Prior authorization requests" },
          { key: "pa_new_button", label: "\"New Request\" button text", default: "New Request" },
          { key: "pa_empty_state", label: "Empty-state message", default: "No requests yet." },
          { key: "pa_empty_cta", label: "Empty-state link text", default: "Create your first one" },
        ],
      },
    ],
  },
  {
    slug: "patients",
    label: "Patients",
    revalidatePaths: ["/dashboard/patients"],
    sections: [
      {
        title: "Heading",
        fields: [
          { key: "patients_h1", label: "Page title", default: "Patients" },
          { key: "patients_add_button", label: "\"Add Patient\" button text", default: "Add Patient" },
          { key: "patients_empty_state", label: "Empty-state message", default: "No patients yet." },
          { key: "patients_empty_cta", label: "Empty-state link text", default: "Add your first one" },
        ],
      },
    ],
  },
  {
    slug: "appeals",
    label: "Appeals",
    revalidatePaths: ["/dashboard/appeals"],
    sections: [
      {
        title: "Heading",
        fields: [
          { key: "appeals_h1", label: "Page title", default: "Claims denials & appeals" },
          { key: "appeals_log_button", label: "\"Log Denial\" button text", default: "Log Denial" },
          { key: "appeals_empty_state", label: "Empty-state message", default: "No claim denials logged yet." },
          { key: "appeals_empty_cta", label: "Empty-state link text", default: "Log your first one" },
        ],
      },
    ],
  },
  {
    slug: "resources",
    label: "Resources",
    revalidatePaths: ["/dashboard/resources"],
    sections: [
      {
        title: "Heading",
        fields: [
          { key: "resources_h1", label: "Page title", default: "Denial guide & deadlines" },
          {
            key: "resources_subtitle",
            label: "Subtitle",
            type: "textarea",
            default: "What each denial reason actually means, how long you have to respond, and where these numbers come from.",
          },
        ],
      },
      {
        title: "Section titles",
        fields: [
          { key: "resources_section1_title", label: "Section 1 title", default: "Denial reason → what to do" },
          { key: "resources_section2_title", label: "Section 2 title", default: "Appeal deadlines by payer" },
          { key: "resources_section3_title", label: "Section 3 title", default: "Sources & verification" },
        ],
      },
    ],
  },
  {
    slug: "billing",
    label: "Billing",
    revalidatePaths: ["/dashboard/billing"],
    sections: [
      {
        title: "Heading",
        fields: [
          { key: "billing_h1", label: "Page title", default: "Billing" },
          { key: "billing_history_title", label: "\"Billing history\" section title", default: "Billing history" },
          {
            key: "billing_multisite_note",
            label: "Multi-Site plan note",
            type: "textarea",
            default: "Multi-Site plans are managed directly — contact hello@asaanbil.com.",
          },
          {
            key: "billing_footer_note",
            label: "Footer disclaimer (shown after the live Practice plan price)",
            type: "textarea",
            default: "billed monthly via Stripe. Invoices are emailed by Stripe after each charge.",
          },
        ],
      },
    ],
  },
];

export function getPageBySlug(slug: string): ContentPageDef | undefined {
  return CONTENT_PAGES.find((p) => p.slug === slug);
}

export function allFieldKeys(page: ContentPageDef): string[] {
  return page.sections.flatMap((s) => s.fields.map((f) => f.key));
}

export function allVisibilityKeys(page: ContentPageDef): string[] {
  return page.sections.filter((s): s is ContentSectionDef & { visibilityKey: string } => !!s.visibilityKey).map((s) => s.visibilityKey);
}

type SiteContentMap = Record<string, { value: string; visible: boolean }>;

export function fieldValue(content: SiteContentMap, field: ContentFieldDef): string {
  return content[field.key]?.value ?? field.default;
}

export function sectionVisible(content: SiteContentMap, section: ContentSectionDef): boolean {
  if (!section.visibilityKey) return true;
  return content[section.visibilityKey]?.visible !== false;
}

// Page components use this instead of repeating "content[key]?.value ?? ..."
// for every field — one lookup map built once per render, keyed the same way
// the admin editor and save action already key their reads/writes.
export function makeFieldGetter(page: ContentPageDef, content: SiteContentMap) {
  const byKey = new Map(page.sections.flatMap((s) => s.fields).map((f) => [f.key, f]));
  return (key: string): string => content[key]?.value ?? byKey.get(key)?.default ?? "";
}
