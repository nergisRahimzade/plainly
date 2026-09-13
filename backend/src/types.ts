export type DocType =
  | "bill"
  | "legal"
  | "error"
  | "form"
  | "insurance"
  | "website"
  | "other";

/** Gemini vision output — also the text fields we persist. */
export interface VisionAnalysis {
  docType: DocType;
  title: string;
  summary: string;
  explanation: string;
  actionItems: string[];
  redFlags: string[];
  keyEntities: string[];
}

export interface RelatedDocRef {
  id: string;
  title: string;
  docType: DocType;
  createdAt: string;
}

/** What MongoDB stores. The raw image is never written here. */
export interface PlainlyDocument {
  userId: string;
  docType: DocType;
  title: string;
  summary: string;
  explanation: string;
  actionItems: string[];
  redFlags: string[];
  keyEntities: string[];
  connections: string[];
  relatedTo: string[];
  embedding: number[];
  createdAt: Date;
}

/** API response: embedding and keyEntities stay server-side. */
export interface PlainlyDocumentPublic {
  id: string;
  userId: string;
  docType: DocType;
  title: string;
  summary: string;
  explanation: string;
  actionItems: string[];
  redFlags: string[];
  connections: string[];
  relatedTo: RelatedDocRef[];
  createdAt: string;
  score?: number;
}
