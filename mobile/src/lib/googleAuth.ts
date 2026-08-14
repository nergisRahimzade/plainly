import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

// Generic OAuth/OIDC discovery for Google — Expo's Google-specific provider was
// deprecated in favor of this approach (see expo-auth-session docs).
const discovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
};

function getGoogleClientId(): string {
  const id =
    Platform.OS === "ios"
      ? process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
      : Platform.OS === "android"
        ? process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
        : process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  return id || "";
}

export function isGoogleSignInConfigured(): boolean {
  return getGoogleClientId().length > 0;
}

/**
 * Google sign-in as an ID token via the OAuth "implicit" flow, verified
 * server-side in `POST /api/auth/google`.
 *
 * Requires EXPO_PUBLIC_GOOGLE_{IOS,ANDROID,WEB}_CLIENT_ID to be set (see
 * mobile/.env.example) and, per Expo's docs, a custom dev/standalone build —
 * this will not complete inside Expo Go.
 */
export function useGoogleAuthRequest() {
  const clientId = getGoogleClientId();
  return AuthSession.useAuthRequest(
    {
      clientId,
      scopes: ["openid", "profile", "email"],
      redirectUri: AuthSession.makeRedirectUri({ scheme: "plainly" }),
      responseType: AuthSession.ResponseType.IdToken,
      usePKCE: false,
      extraParams: {
        nonce: Math.random().toString(36).slice(2),
      },
    },
    discovery
  );
}
