import type { PlainlyDocumentPublic } from "../types";
import { getUserId } from "./userId";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8080";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const userId = await getUserId();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId,
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore json parse errors
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function listDocuments() {
  return request<PlainlyDocumentPublic[]>("/api/documents");
}

export function getDocument(id: string) {
  return request<PlainlyDocumentPublic>(`/api/documents/${id}`);
}

export function uploadDocument(imageBase64: string, mimeType: string) {
  return request<PlainlyDocumentPublic>("/api/documents", {
    method: "POST",
    body: JSON.stringify({ imageBase64, mimeType }),
  });
}

export function searchDocuments(query: string) {
  return request<PlainlyDocumentPublic[]>(`/api/documents/search?q=${encodeURIComponent(query)}`);
}

export function deleteDocument(id: string) {
  return request<void>(`/api/documents/${id}`, { method: "DELETE" });
}

/** Seeds the current user's real history with curated example documents (real DB records). */
export function seedExampleDocuments() {
  return request<PlainlyDocumentPublic[]>("/api/documents/seed", { method: "POST" });
}
