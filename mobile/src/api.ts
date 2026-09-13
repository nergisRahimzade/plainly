import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PlainlyDocumentPublic } from "./types";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8080";
const USER_ID_KEY = "plainly_user_id";

let cachedUserId: string | null = null;

async function getUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId;
  let id = await AsyncStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    await AsyncStorage.setItem(USER_ID_KEY, id);
  }
  cachedUserId = id;
  return id;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-user-id": await getUserId(),
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // keep the status message
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
