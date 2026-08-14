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

export type AuthProvider = "password" | "google" | "apple";

export interface User {
  email: string | null;
  /** Only set for password-based accounts. */
  passwordHash?: string;
  name?: string;
  avatarUrl?: string;
  /** How this account was created. A single account can only use one provider today. */
  provider: AuthProvider;
  /** Stable subject id from the OAuth provider (Google `sub`, Apple `sub`). */
  providerId?: string;
  createdAt: Date;
}

export interface UserPublic {
  id: string;
  email: string | null;
  name?: string;
  avatarUrl?: string;
  provider: AuthProvider;
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
