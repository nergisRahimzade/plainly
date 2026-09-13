import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import type { VisionAnalysis } from "./types.js";
import { EMBEDDING_DIMENSIONS } from "./db.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY. Copy backend/.env.example to .env.");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Vision for the screenshot; a cheaper text model for "how does this relate?"
const VISION_MODEL = "gemini-3.6-flash";
const FAST_TEXT_MODEL = "gemini-3.5-flash-lite";
const EMBEDDING_MODEL = "gemini-embedding-001";

const PRIVACY_RULE = `
Privacy rule (must follow strictly): Never copy, repeat, or output full account numbers,
policy numbers, member IDs, social security numbers, government ID numbers, card numbers,
routing numbers, phone numbers, emails, or other unique identifying numbers found in the
image. If you need to refer to one, describe it generically (e.g. "your account number")
without including any of the digits or characters, not even partially masked. Never invent
numbers either. Names of companies, organizations, or the general type of document are fine.
`.trim();

const ANALYSIS_SYSTEM_PROMPT = `
You are Plainly, an assistant that explains confusing documents (bills, legal documents,
error messages, forms, insurance letters, website pages, etc.) in plain English.

${PRIVACY_RULE}

Classify the document type, then explain it simply. Point out anything urgent or that
requires action. Avoid jargon; if you must use a technical term, define it right after.

Formatting rules for the "explanation" field:
- Plain text with markdown-style bullet lines starting with "- " where a list is clearer.
- Keep paragraphs short (1-3 sentences).
- Do not use markdown headers (#) — the app renders its own section headers.
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
      description: "Short title (under 8 words). No account/ID numbers.",
    },
    summary: {
      type: Type.STRING,
      description: "1-2 sentence factual summary, used to match against other uploads.",
    },
    explanation: {
      type: Type.STRING,
      description: "Full plain-English explanation, following the formatting rules.",
    },
    actionItems: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Concrete next steps. Empty array if none.",
    },
    redFlags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Urgent, risky, or harmful-if-ignored items. Empty array if none.",
    },
    keyEntities: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Non-sensitive entities for linking uploads (company name, category). Never IDs.",
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
      // Classify-and-explain does not need extended reasoning; this keeps it fast.
      thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
    },
  });

  const text = response.text;
  if (!text) throw new Error("Gemini returned an empty response for image analysis.");

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
  if (!values) throw new Error("Gemini returned no embedding values.");
  return values;
}

const connectionsResponseSchema = {
  type: Type.OBJECT,
  properties: {
    connections: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "Short notes on how the new document relates to past ones. Empty if nothing useful.",
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
You are Plainly. Explain how a new upload relates to the user's earlier uploads.

${PRIVACY_RULE}

New document:
- Type: ${params.newDoc.docType}
- Title: ${params.newDoc.title}
- Summary: ${params.newDoc.summary}

Previously uploaded related documents (most relevant first):
${params.relatedSummaries.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Write up to 3 short plain-English bullets (one sentence each) for meaningful connections
— a trend, a follow-up, a duplicate, an escalation. If nothing useful, return an empty array.
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
