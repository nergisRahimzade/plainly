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

export type AuthProvider = "password" | "google" | "apple";

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

export interface MemoryPublic {
  id: string;
  content: string;
  sourceType: MemorySourceType;
  sourceId?: string;
  createdAt: string;
}
