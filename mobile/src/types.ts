export type DocType =
  | "bill"
  | "legal"
  | "error"
  | "form"
  | "insurance"
  | "website"
  | "other";

export interface RelatedDocRef {
  id: string;
  title: string;
  docType: DocType;
  createdAt: string;
}

/** Same shape the API returns (backend/src/types.ts → PlainlyDocumentPublic). */
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
