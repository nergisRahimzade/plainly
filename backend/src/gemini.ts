import { GoogleGenAI, Type } from "@google/genai";
import type { VisionAnalysis } from "./types.js";
import { EMBEDDING_DIMENSIONS } from "./db.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable. Copy .env.example to .env and fill it in.");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const VISION_MODEL = "gemini-2.5-flash";
const EMBEDDING_MODEL = "gemini-embedding-001";

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
    model: VISION_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: connectionsResponseSchema,
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
