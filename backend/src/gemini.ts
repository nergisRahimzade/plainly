import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import type { VisionAnalysis } from "./types.js";
import { EMBEDDING_DIMENSIONS } from "./db.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable. Copy .env.example to .env and fill it in.");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const VISION_MODEL = "gemini-3.6-flash";
const FAST_TEXT_MODEL = "gemini-3.5-flash-lite";
const EMBEDDING_MODEL = "gemini-embedding-001";
const CHAT_MODEL = "gemini-3.6-flash";

const PRIVACY_RULE = `
Privacy rule (must follow strictly): Never copy, repeat, or output full account numbers,
policy numbers, member IDs, social security numbers, government ID numbers, card numbers,
routing numbers, phone numbers, emails, or other unique identifying numbers found in the
image. If you need to refer to one, describe it generically (e.g. "your account number",
"the policy number on file") without including any of the digits or characters, not even
partially masked. Never invent numbers either. Names of companies, organizations, or the
general type of document are fine to mention.
`.trim();

const ANALYSIS_SYSTEM_PROMPT = `
You are Plainly, an assistant that explains confusing documents (bills, legal documents,
error messages, forms, insurance letters, website pages, etc.) in plain, simple English for
someone with no background knowledge in the subject.

${PRIVACY_RULE}

Classify the document type, then explain it simply and clearly. Point out anything urgent
or that requires action. Write for a general audience - avoid jargon, and if you must use a
technical or legal term, briefly define it in plain words right after.

Formatting rules for the "explanation" field:
- Plain text with markdown-style bullet lines starting with "- " where a list is clearer than prose.
- Keep paragraphs short (1-3 sentences).
- Do not use markdown headers (#) inside "explanation" - the app renders its own section headers.
`.trim();

const analysisResponseSchema = {
  type: Type.OBJECT,
  properties: {
    docType: {
      type: Type.STRING,
      enum: ["bill", "legal", "error", "form", "insurance", "website", "other"],
    },
    title: {
      type: Type.STRING,
      description: "A short (under 8 words) human-friendly title for this document, e.g. 'Electric Bill from ACME Power'. Do not include any account/ID numbers.",
    },
    summary: {
      type: Type.STRING,
      description: "1-2 sentence factual summary of what this document is, used to match it against the user's other uploads. No sensitive numbers.",
    },
    explanation: {
      type: Type.STRING,
      description: "The full plain-English explanation of the document, following the formatting rules.",
    },
    actionItems: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Concrete next steps the user should consider taking. Empty array if none.",
    },
    redFlags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Anything urgent, risky, or that could hurt the user if ignored (deadlines, fees, suspicious clauses, scam signs). Empty array if none.",
    },
    keyEntities: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Non-sensitive entities useful for linking related uploads together, e.g. company name, doc category, case name. Never include ID/account numbers here.",
    },
  },
  required: ["docType", "title", "summary", "explanation", "actionItems", "redFlags", "keyEntities"],
} as const;

export async function analyzeScreenshot(params: {
  base64Image: string;
  mimeType: string;
}): Promise<VisionAnalysis> {
  const response = await ai.models.generateContent({
    model: VISION_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { text: ANALYSIS_SYSTEM_PROMPT },
          {
            inlineData: {
              mimeType: params.mimeType,
              data: params.base64Image,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: analysisResponseSchema,
      // This is a straightforward classify-and-explain task, not something that
      // benefits from extended reasoning - minimizing it cuts response time significantly.
      thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response for image analysis.");
  }

  const parsed = JSON.parse(text) as VisionAnalysis;
  return {
    docType: parsed.docType,
    title: parsed.title?.trim() || "Untitled document",
    summary: parsed.summary?.trim() || "",
    explanation: parsed.explanation?.trim() || "",
    actionItems: parsed.actionItems ?? [],
    redFlags: parsed.redFlags ?? [],
    keyEntities: parsed.keyEntities ?? [],
  };
}

export async function embedText(text: string): Promise<number[]> {
  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
    config: {
      outputDimensionality: EMBEDDING_DIMENSIONS,
      taskType: "SEMANTIC_SIMILARITY",
    },
  });

  const values = response.embeddings?.[0]?.values;
  if (!values) {
    throw new Error("Gemini returned no embedding values.");
  }
  return values;
}

const connectionsResponseSchema = {
  type: Type.OBJECT,
  properties: {
    connections: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Short plain-English bullet points describing how the new document relates to the past ones (trends, follow-ups, duplicates, escalations). Empty array if there is no meaningful connection.",
    },
  },
  required: ["connections"],
} as const;

export async function findConnections(params: {
  newDoc: Pick<VisionAnalysis, "title" | "summary" | "docType">;
  relatedSummaries: string[];
}): Promise<string[]> {
  if (params.relatedSummaries.length === 0) return [];

  const prompt = `
You are Plainly, an assistant that helps users understand how a new uploaded document relates
to documents they uploaded previously.

${PRIVACY_RULE}

New document:
- Type: ${params.newDoc.docType}
- Title: ${params.newDoc.title}
- Summary: ${params.newDoc.summary}

Previously uploaded related documents (most relevant first):
${params.relatedSummaries.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Write up to 3 short, plain-English bullet points (no more than one short sentence each)
describing meaningful connections between the new document and the previous ones - for
example a trend (amount going up), a follow-up notice, a duplicate charge, or an escalation.
Only include a connection if it is actually useful to the user. If there is nothing
meaningful to say, return an empty array.
`.trim();

  const response = await ai.models.generateContent({
    model: FAST_TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: connectionsResponseSchema,
      thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
    },
  });

  const text = response.text;
  if (!text) return [];
  try {
    const parsed = JSON.parse(text) as { connections: string[] };
    return parsed.connections ?? [];
  } catch {
    return [];
  }
}

const CHAT_SYSTEM_PROMPT = `
You are the Plainly chat assistant. Plainly already explained the user's confusing documents
(bills, legal notices, forms, insurance letters, error messages, etc.) in plain English, and
this chat is where the user can ask follow-up questions, get help deciding what to do next, or
ask Plainly to recall something about a past document or a past conversation.

${PRIVACY_RULE}

You will be given relevant snippets retrieved from the user's document history and/or earlier
conversations, labeled "Relevant context from your history". Use it naturally to answer -
for example, if the user asks why they needed to do something, look for the reason in that
context and explain it back to them plainly. If the context doesn't actually answer their
question, say you're not sure rather than guessing or inventing details.

Keep replies warm, concise, and practical - short paragraphs or a few bullet points, not an
essay. Do not use markdown headers (#).
`.trim();

export interface ChatTurn {
  role: "user" | "model";
  content: string;
}

export async function chatReply(params: {
  history: ChatTurn[];
  message: string;
  context: string[];
}): Promise<string> {
  const contextBlock =
    params.context.length > 0
      ? `Relevant context from your history:\n${params.context.map((c, i) => `${i + 1}. ${c}`).join("\n")}\n\n---\n\n`
      : "";

  const response = await ai.models.generateContent({
    model: CHAT_MODEL,
    contents: [
      ...params.history.map((turn) => ({ role: turn.role, parts: [{ text: turn.content }] })),
      { role: "user", parts: [{ text: `${contextBlock}${params.message}` }] },
    ],
    config: {
      systemInstruction: CHAT_SYSTEM_PROMPT,
      thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
    },
  });

  return response.text?.trim() || "Sorry, I couldn't come up with a response just now. Could you try rephrasing that?";
}

const memoriesResponseSchema = {
  type: Type.OBJECT,
  properties: {
    memories: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "0-3 short, standalone, plain-English facts worth recalling in a future conversation - " +
        "especially *why* the user needed to do something (a reason, a deadline, a decision they " +
        "made or need to make). Each one must make sense entirely on its own, with no pronouns " +
        "referring back to this conversation (e.g. write 'The user's landlord raised rent because " +
        "of a lease renewal' not 'They raised it because of that'). Empty array if there's nothing " +
        "worth remembering long-term.",
    },
  },
  required: ["memories"],
} as const;

/**
 * Extracts small, standalone "long-term memory" facts from a document analysis or chat
 * exchange - in particular the *reasons* behind actions - so a much later conversation can
 * recall them even without the original document or chat thread in its immediate context.
 */
export async function extractMemories(sourceText: string): Promise<string[]> {
  const prompt = `
You help Plainly (an assistant that explains confusing documents and answers follow-up
questions about them) build a long-term memory of things worth recalling later.

${PRIVACY_RULE}

Read the following and extract any standalone facts worth remembering long-term, especially
*why* the user needed or wanted to do something.

---
${sourceText}
---
`.trim();

  const response = await ai.models.generateContent({
    model: FAST_TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: memoriesResponseSchema,
      thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
    },
  });

  const text = response.text;
  if (!text) return [];
  try {
    const parsed = JSON.parse(text) as { memories: string[] };
    return (parsed.memories ?? []).map((m) => m.trim()).filter(Boolean);
  } catch {
    return [];
  }
}
