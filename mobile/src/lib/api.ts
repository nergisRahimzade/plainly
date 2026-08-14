import type { PlainlyDocumentPublic, UserPublic } from "../types";
import { getUserId } from "./userId";
import { getToken } from "./authStorage";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8080";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getToken();
  const userId = await getUserId();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      // A signed-in account's bearer token takes priority; the guest x-user-id
      // is always sent too so the backend can fall back to it seamlessly.
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

export interface AuthResponse {
  token: string;
  user: UserPublic;
}

export function registerWithEmail(email: string, password: string, name?: string) {
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

export function loginWithEmail(email: string, password: string) {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function loginWithGoogle(idToken: string) {
  return request<AuthResponse>("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
}

export function loginWithApple(identityToken: string, name?: string) {
  return request<AuthResponse>("/api/auth/apple", {
    method: "POST",
    body: JSON.stringify({ identityToken, name }),
  });
}

export function fetchCurrentUser() {
  return request<UserPublic>("/api/auth/me");
}

export function logout() {
  return request<void>("/api/auth/logout", { method: "POST" });
}
