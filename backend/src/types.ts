export type DocType =
  | "bill"
  | "legal"
  | "error"
  | "form"
  | "insurance"
  | "website"
  | "other";

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
