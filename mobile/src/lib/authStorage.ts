import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "plainly_auth_token";

// Cached in memory so `api.ts` can read the token synchronously on every
// request without an AsyncStorage round-trip; kept in sync by AuthContext.
let cachedToken: string | null | undefined;

export async function getToken(): Promise<string | null> {
  if (cachedToken !== undefined) return cachedToken;
  const stored = await AsyncStorage.getItem(TOKEN_KEY);
  cachedToken = stored;
  return stored;
}

export function getCachedToken(): string | null {
  return cachedToken ?? null;
}

export async function setToken(token: string): Promise<void> {
  cachedToken = token;
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  cachedToken = null;
  await AsyncStorage.removeItem(TOKEN_KEY);
}
