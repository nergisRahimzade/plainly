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

export type ChatRole = "user" | "model";

export interface ChatMessage {
  role: ChatRole;
  content: string;
  createdAt: Date;
  /** Document ids used as retrieved context for this reply (model messages only). */
  contextDocumentIds?: string[];
}

export interface Conversation {
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessagePublic {
  role: ChatRole;
  content: string;
  createdAt: string;
  contextDocs?: RelatedDocRef[];
}

export interface ConversationPublic {
  id: string;
  title: string;
  messages: ChatMessagePublic[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationSummaryPublic {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
}

export type MemorySourceType = "document" | "chat";

export interface Memory {
  userId: string;
  /** Short, standalone, plain-English fact worth recalling later (the "why" behind an action, a decision, a preference, etc.). */
  content: string;
  embedding: number[];
  sourceType: MemorySourceType;
  /** Id of the document or conversation this memory was extracted from, if any. */
  sourceId?: string;
  createdAt: Date;
}

export interface MemoryPublic {
  id: string;
  content: string;
  sourceType: MemorySourceType;
  sourceId?: string;
  createdAt: string;
}
