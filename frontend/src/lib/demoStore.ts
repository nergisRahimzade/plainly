import type { PlainlyDocumentPublic } from "../types";
import { DEMO_SEED_DOCS, DEMO_UPLOAD_ROTATION } from "./demoData";

// Simulates the "analyzing…" delay of a real Gemini vision call, so the demo
// upload flow feels like the real thing rather than resolving instantly.
const UPLOAD_SIMULATION_DELAY_MS = 1800;

let documents: PlainlyDocumentPublic[] = [];
let uploadRotationIndex = 0;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function byNewestFirst(a: PlainlyDocumentPublic, b: PlainlyDocumentPublic): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export function resetDemoStore(): void {
  documents = clone(DEMO_SEED_DOCS).sort(byNewestFirst);
  uploadRotationIndex = 0;
}

export function getDemoDocuments(): PlainlyDocumentPublic[] {
  if (documents.length === 0) resetDemoStore();
  return [...documents];
}

export function getDemoDocument(id: string): PlainlyDocumentPublic | undefined {
  return documents.find((d) => d.id === id);
}

export function removeDemoDocument(id: string): void {
  documents = documents.filter((d) => d.id !== id);
}

export function searchDemoDocuments(query: string): PlainlyDocumentPublic[] {
  const q = query.trim().toLowerCase();
  if (!q) return getDemoDocuments();
  return documents.filter((d) =>
    [d.title, d.summary, d.explanation, d.docType, ...d.actionItems, ...d.redFlags].some((field) =>
      field.toLowerCase().includes(q)
    )
  );
}

export function simulateUpload(): Promise<PlainlyDocumentPublic> {
  if (documents.length === 0) resetDemoStore();
  return new Promise((resolve) => {
    setTimeout(() => {
      const template = DEMO_UPLOAD_ROTATION[uploadRotationIndex % DEMO_UPLOAD_ROTATION.length];
      uploadRotationIndex += 1;

      const doc = clone(template);
      doc.id = `demo-upload-${Date.now()}`;
      doc.createdAt = new Date().toISOString();
      // Re-resolve related-doc references against whatever's currently in the
      // demo history, in case an earlier demo document was deleted this session.
      doc.relatedTo = doc.relatedTo
        .map((ref) => documents.find((d) => d.id === ref.id))
        .filter((d): d is PlainlyDocumentPublic => Boolean(d))
        .map((d) => ({ id: d.id, title: d.title, docType: d.docType, createdAt: d.createdAt }));

      documents = [doc, ...documents];
      resolve(doc);
    }, UPLOAD_SIMULATION_DELAY_MS);
  });
}
