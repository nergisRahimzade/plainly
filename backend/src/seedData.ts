import type { DocType } from "./types.js";

export interface SeedDocInput {
  docType: DocType;
  title: string;
  summary: string;
  explanation: string;
  actionItems: string[];
  redFlags: string[];
  keyEntities: string[];
  connections: string[];
  /** Title of an earlier entry in this list to link as a related document. */
  relatedToTitle?: string;
  daysAgo: number;
}

// Curated, realistic example documents used by POST /api/documents/seed so a
// user can populate their real history (real MongoDB records, real
// embeddings) for a live demo, without needing to actually photograph real
// bills/letters. Unlike the frontend's offline demo mode, these go through
// the real database and real vector index, so genuine new uploads afterward
// can find and connect to them.
export const SEED_DOCUMENTS: SeedDocInput[] = [
  {
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
    redFlags: [
      "A $6.50 estimated-usage fee was added because your meter wasn't actually read this cycle.",
    ],
    keyEntities: ["Riverside Electric", "electricity bill"],
    connections: [],
    daysAgo: 62,
  },
  {
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
    redFlags: [
      "Your bill increased by $14.24 compared to last month even though usage rose only slightly.",
    ],
    keyEntities: ["Riverside Electric", "electricity bill"],
    connections: [
      "This is your 2nd bill from Riverside Electric — the amount increased by $14.24 compared to last month.",
    ],
    relatedToTitle: "Riverside Electric — August Bill",
    daysAgo: 32,
  },
  {
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
    keyEntities: ["HOA", "violation notice", "fence"],
    connections: [],
    daysAgo: 21,
  },
  {
    docType: "error",
    title: "Banking App — \"Error 402: Payment Required\"",
    summary:
      "A payment failed to process in a banking app with a generic 402 error code and no further explanation.",
    explanation: `Your banking app showed a generic "Error 402: Payment Required" message when you tried to send a payment.

- A 402 error is a server-side response code — it usually means the bank's payment processor rejected or couldn't complete the request, not that something is wrong with your account.
- These errors are frequently temporary, caused by brief outages in a payment processor rather than by insufficient funds or a blocked card.
- The app gave no indication of whether the payment actually went through partially.`,
    actionItems: [
      "Check your transaction history before retrying, to make sure the payment didn't actually go through.",
      "Wait a few minutes and try again — 402 errors are often temporary.",
      "Contact support if a payment is stuck as \"pending\" for more than 24 hours.",
    ],
    redFlags: [
      "Retrying immediately without checking your transaction history first could result in a duplicate charge.",
    ],
    keyEntities: ["banking app", "payment error"],
    connections: [],
    daysAgo: 9,
  },
  {
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
    keyEntities: ["Explanation of Benefits", "EOB", "urgent care"],
    connections: [],
    daysAgo: 4,
  },
];
