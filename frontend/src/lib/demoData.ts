import type { PlainlyDocumentPublic, RelatedDocRef } from "../types";

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

function toRef(doc: PlainlyDocumentPublic): RelatedDocRef {
  return { id: doc.id, title: doc.title, docType: doc.docType, createdAt: doc.createdAt };
}

const bill1: PlainlyDocumentPublic = {
  id: "demo-bill-1",
  userId: "demo",
  docType: "bill",
  title: "Riverside Electric — August Bill",
  summary: "Monthly electricity bill from Riverside Electric for $142.18, due in 21 days.",
  explanation: `This is a routine monthly electricity bill from Riverside Electric.

- Your usage this cycle was 612 kWh, billed at the standard residential rate.
- A one-time $6.50 "estimated usage adjustment" was added because your meter wasn't read this cycle — it will be corrected automatically next month once a real reading is taken.
- The total of $142.18 is due in 21 days. Paying after that adds a 1.5% late fee.`,
  actionItems: [
    "Pay the $142.18 balance before the due date to avoid a late fee.",
    "Consider enrolling in budget billing if your usage varies a lot month to month.",
  ],
  redFlags: ["A $6.50 estimated-usage fee was added because your meter wasn't actually read this cycle."],
  connections: [],
  relatedTo: [],
  createdAt: daysAgo(62),
};

const bill2: PlainlyDocumentPublic = {
  id: "demo-bill-2",
  userId: "demo",
  docType: "bill",
  title: "Riverside Electric — September Bill",
  summary: "Monthly electricity bill from Riverside Electric for $156.42, up from last month.",
  explanation: `Another monthly bill from Riverside Electric, based on an actual meter reading this time.

- Usage was 634 kWh, only slightly higher than last month's 612 kWh.
- The bill total, $156.42, rose more than usage alone would explain.
- Due in 21 days, same terms as before.`,
  actionItems: [
    "Pay $156.42 before the due date.",
    "Compare this month's usage to last month if the price increase seems larger than expected.",
  ],
  redFlags: ["Your bill increased by $14.24 compared to last month even though usage rose only slightly."],
  connections: [
    "This is your 2nd bill from Riverside Electric — the amount increased by $14.24 compared to last month.",
  ],
  relatedTo: [toRef(bill1)],
  createdAt: daysAgo(32),
};

const legal1: PlainlyDocumentPublic = {
  id: "demo-legal-1",
  userId: "demo",
  docType: "legal",
  title: "HOA Notice of Violation — Fence Height",
  summary:
    "A formal notice from your homeowners association claiming your backyard fence exceeds the allowed height and must be corrected within 30 days.",
  explanation: `Your homeowners association (HOA) sent a formal violation notice.

- They claim your backyard fence is taller than the 6-foot limit allowed by the community bylaws.
- You have 30 days from the date of the letter to bring the fence into compliance or respond.
- If nothing is done, the letter states recurring fines may begin after the deadline.`,
  actionItems: [
    "Measure your fence and compare it to the 6-foot limit cited in the notice.",
    "Respond in writing before the 30-day deadline, even if you plan to dispute it.",
    "Request the specific HOA bylaw section being cited, in writing.",
  ],
  redFlags: [
    "If uncorrected, the notice states you could be fined $50 per week starting after the deadline.",
    "The 30-day compliance deadline is a separate clause from the HOA's right-of-first-refusal terms — don't confuse the two.",
  ],
  connections: [],
  relatedTo: [],
  createdAt: daysAgo(21),
};

const error1: PlainlyDocumentPublic = {
  id: "demo-error-1",
  userId: "demo",
  docType: "error",
  title: "Banking App — \"Error 402: Payment Required\"",
  summary: "A payment failed to process in a banking app with a generic 402 error code and no further explanation.",
  explanation: `Your banking app showed a generic "Error 402: Payment Required" message when you tried to send a payment.

- A 402 error is a server-side response code — it usually means the bank's payment processor rejected or couldn't complete the request, not that something is wrong with your account.
- These errors are frequently temporary, caused by brief outages in a payment processor rather than by insufficient funds or a blocked card.
- The app gave no indication of whether the payment actually went through partially.`,
  actionItems: [
    "Check your transaction history before retrying, to make sure the payment didn't actually go through.",
    "Wait a few minutes and try again — 402 errors are often temporary.",
    "Contact support if a payment is stuck as \"pending\" for more than 24 hours.",
  ],
  redFlags: ["Retrying immediately without checking your transaction history first could result in a duplicate charge."],
  connections: [],
  relatedTo: [],
  createdAt: daysAgo(9),
};

const insurance1: PlainlyDocumentPublic = {
  id: "demo-insurance-1",
  userId: "demo",
  docType: "insurance",
  title: "Explanation of Benefits — Urgent Care Visit",
  summary:
    "Your insurer's summary of what they paid and what you may owe for a recent urgent care visit — this is not a bill.",
  explanation: `This document is an Explanation of Benefits (EOB), not a bill — it's your insurer's summary of how a claim was processed.

- It lists the amount the clinic billed, the amount your insurance plan covered, and an estimated amount you may owe ("patient responsibility").
- One line item, a $340 charge, is marked "out-of-network" even though the clinic was described to you as in-network at check-in.
- The actual bill from the clinic, if any, will arrive separately from the provider — it should closely match the "patient responsibility" figure here.`,
  actionItems: [
    "Wait for the actual bill from the provider before paying anything — an EOB is not a request for payment.",
    "Compare the \"patient responsibility\" amount here to any bill you receive to make sure they match.",
    "Call your insurer to dispute the out-of-network charge if you were told the clinic was in-network.",
  ],
  redFlags: [
    "A $340 charge is listed as out-of-network despite the clinic reportedly being in-network — worth disputing before paying.",
  ],
  connections: [],
  relatedTo: [],
  createdAt: daysAgo(4),
};

export const DEMO_SEED_DOCS: PlainlyDocumentPublic[] = [bill1, bill2, legal1, error1, insurance1];

const bill3Template: PlainlyDocumentPublic = {
  id: "demo-bill-3",
  userId: "demo",
  docType: "bill",
  title: "Riverside Electric — October Bill",
  summary: "Monthly electricity bill from Riverside Electric for $171.05 — the third consecutive increase.",
  explanation: `Another monthly bill from Riverside Electric.

- Usage was 641 kWh, close to last month's 634 kWh.
- The total, $171.05, is the third month in a row this bill has increased, and usage alone doesn't explain the trend.
- Due in 21 days, same terms as before.`,
  actionItems: [
    "Pay $171.05 before the due date.",
    "Request a usage/rate audit from Riverside Electric given the three-month upward trend.",
  ],
  redFlags: ["This is the third month in a row your bill has increased, and usage doesn't fully explain it."],
  connections: [
    "This is your 3rd bill from Riverside Electric in a row — the amount has increased every month, from $142.18 to $156.42 to $171.05.",
    "Given the consistent upward trend, it may be worth requesting a usage audit from the provider.",
  ],
  relatedTo: [toRef(bill1), toRef(bill2)],
  createdAt: daysAgo(0),
};

const website1Template: PlainlyDocumentPublic = {
  id: "demo-website-1",
  userId: "demo",
  docType: "website",
  title: "Streaming Service — Cancellation Page",
  summary:
    "A confusing account-cancellation flow that appears to switch you to a cheaper \"paused\" plan instead of actually canceling.",
  explanation: `This is a subscription cancellation page from a streaming service.

- The large, highlighted button is labeled "Pause my membership," which keeps you subscribed at a reduced rate rather than canceling.
- A much smaller, less visible link further down the page is the actual "Cancel membership" option.
- No confirmation email is mentioned on this page — you may want to save proof once you do cancel.`,
  actionItems: [
    "Look for the smaller \"Cancel membership\" link — the prominent button only pauses, rather than cancels, your subscription.",
    "Take a screenshot of your final cancellation confirmation for your records.",
  ],
  redFlags: [
    "The page defaults to \"Pause my membership\" (which keeps billing you at a reduced rate) instead of full cancellation — a common dark pattern.",
  ],
  connections: [],
  relatedTo: [],
  createdAt: daysAgo(0),
};

const form1Template: PlainlyDocumentPublic = {
  id: "demo-form-1",
  userId: "demo",
  docType: "form",
  title: "Background Check Consent Form",
  summary: "A standard authorization form allowing a prospective employer to run a background check as part of your job application.",
  explanation: `This is a consent form authorizing a background check as part of a job application.

- It covers standard categories: criminal history, employment history, and education verification.
- One clause authorizes "ongoing monitoring" for the duration of employment, not just a one-time check before hiring.
- Your signature is required before the employer can legally run any check.`,
  actionItems: [
    "Confirm the scope of the background check matches what was described in your job offer.",
    "Ask about the \"ongoing monitoring\" clause if you're not comfortable with checks continuing after you're hired.",
    "Keep a signed copy for your own records.",
  ],
  redFlags: [
    "The form includes a broad \"ongoing monitoring\" clause that allows repeated checks indefinitely unless you ask to have it limited.",
  ],
  connections: [],
  relatedTo: [],
  createdAt: daysAgo(0),
};

/** Cycled through, in order, each time a new screenshot is "uploaded" in demo mode. */
export const DEMO_UPLOAD_ROTATION: PlainlyDocumentPublic[] = [
  bill3Template,
  website1Template,
  form1Template,
];
