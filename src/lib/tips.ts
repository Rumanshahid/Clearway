// Paraphrased guidance drawn from public denial-code patterns, payer appeal
// deadlines, and published appeal-outcome data — rewritten in original
// wording, not quoted from any source. Shown as rotating tips while staff
// are drafting or reviewing a letter.

export interface Tip {
  category: "denial" | "deadline" | "success" | "voice";
  text: string;
}

export const TIPS: Tip[] = [
  // Denial code → what actually fixes it
  { category: "denial", text: "A \"not medically necessary\" denial usually needs new clinical evidence plus a direct citation to a specialty-society guideline — not just a resubmission of the same letter." },
  { category: "denial", text: "If a denial says conservative care wasn't documented, spell out exactly which treatments were tried, for how long, and what happened. Vague language is the single most common reason these get rejected twice." },
  { category: "denial", text: "A step-therapy denial means the payer wants proof the required cheaper option was tried and failed, or is contraindicated. Records from a previous insurer still count." },
  { category: "denial", text: "If a denial cites missing documentation, the fix is almost always to attach the missing record and briefly explain why it wasn't included the first time — not to re-argue the clinical case." },
  { category: "denial", text: "\"Experimental or investigational\" denials respond best to peer-reviewed literature or an FDA approval citation, not a physician's opinion alone." },
  { category: "denial", text: "A wrong CPT code on a denial isn't a clinical appeal — it's a straightforward resubmission with the corrected code." },
  { category: "denial", text: "\"Member not eligible\" denials are an administrative fix. Verify eligibility first before treating it as a clinical appeal." },
  { category: "denial", text: "If an urgent request got processed on the standard timeline instead of expedited, add a specific urgency certification with a timeline for harm — don't just resend the same letter." },
  { category: "denial", text: "Concurrent-care extension denials need objective before-and-after measurements, not a general statement that the patient is improving." },
  { category: "denial", text: "Retrospective authorization for care already given has the lowest approval odds of any letter type. The strongest cases are genuine emergencies with contemporaneous ER or admission records attached." },

  // Deadlines
  { category: "deadline", text: "Aetna gives roughly six months to file a standard appeal, but only 72 hours once a case is marked expedited." },
  { category: "deadline", text: "UnitedHealthcare's commercial appeal window is noticeably shorter than most major payers — about two months, not six." },
  { category: "deadline", text: "Medicare Advantage appeals generally need to be filed within 60 days of the denial date." },
  { category: "deadline", text: "Some payers' retrospective-authorization filing windows are as short as 10 business days from the date of service. Missing it usually forfeits the right to appeal that claim at all — check the window before you start writing." },
  { category: "deadline", text: "Most major payers offer a peer-to-peer call before or during the appeal process. Asking for one, even when it isn't required, tends to speed things up." },

  // Success / verification
  { category: "success", text: "Independent tracking of prior-authorization appeals consistently finds a large majority succeed once actually filed — the bigger problem is how few denials get appealed at all." },
  { category: "success", text: "Appeals that cite a payer's own published clinical criteria point-by-point tend to succeed noticeably more often than appeals that argue in general terms." },
  { category: "success", text: "A peer-to-peer conversation before or during an appeal measurably improves approval odds compared to a written appeal alone, according to physician-reported data." },
  { category: "success", text: "Federal rules set a 7-calendar-day ceiling for standard prior-authorization decisions, and 72 hours for expedited ones. If a payer is taking longer than that, it's worth escalating." },
  { category: "success", text: "A significant share of national spend on denial appeals goes toward claims that are ultimately overturned — meaning a meaningful share of denials were avoidable to begin with." },

  // Writing quality
  { category: "voice", text: "Naming the exact drug, dose, and duration tried is far more persuasive to a reviewer than writing \"conservative treatment was attempted.\"" },
  { category: "voice", text: "A letter that leans only on \"medically necessary\" without explaining the consequence of delay reads as circular to a reviewer — spell out what actually happens if the request isn't approved." },
  { category: "voice", text: "Citing one policy source with confidence reads stronger than listing several possible ones and hedging between them." },
  { category: "voice", text: "A reviewer working through dozens of letters a day relies on numbered headings to find what they need in seconds — burying the rationale in flowing prose slows them down and hurts your odds." },
];

export function getRandomTip(excludeIndex?: number): { tip: Tip; index: number } {
  let index = Math.floor(Math.random() * TIPS.length);
  if (TIPS.length > 1 && index === excludeIndex) {
    index = (index + 1) % TIPS.length;
  }
  return { tip: TIPS[index], index };
}
