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
