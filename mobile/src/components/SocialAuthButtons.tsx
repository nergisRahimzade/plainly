import { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform, ActivityIndicator, Alert } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { useGoogleAuthRequest, isGoogleSignInConfigured } from "../lib/googleAuth";
import { useAuth } from "../context/AuthContext";
import { colors, fonts, radii } from "../theme";

interface SocialAuthButtonsProps {
  onDone: () => void;
  onError: (message: string) => void;
}

export default function SocialAuthButtons({ onDone, onError }: SocialAuthButtonsProps) {
  const { signInWithGoogleToken, signInWithAppleToken } = useAuth();
  const [request, response, promptAsync] = useGoogleAuthRequest();
  const [isGoogleBusy, setIsGoogleBusy] = useState(false);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS === "ios") {
      AppleAuthentication.isAvailableAsync().then(setIsAppleAvailable);
    }
  }, []);

  useEffect(() => {
    if (response?.type === "success" && response.params.id_token) {
      setIsGoogleBusy(true);
      signInWithGoogleToken(response.params.id_token)
        .then(onDone)
        .catch((err) => onError(err instanceof Error ? err.message : "Google sign-in failed."))
        .finally(() => setIsGoogleBusy(false));
    } else if (response?.type === "error") {
      onError(response.error?.message || "Google sign-in failed.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  async function handleGooglePress() {
    if (!isGoogleSignInConfigured()) {
      Alert.alert(
        "Google sign-in not configured",
        "Set EXPO_PUBLIC_GOOGLE_*_CLIENT_ID in mobile/.env and rebuild the dev client to enable this."
      );
      return;
    }
    await promptAsync();
  }

  async function handleApplePress() {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error("Apple did not return an identity token.");
      const name = credential.fullName
        ? [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(" ")
        : undefined;
      await signInWithAppleToken(credential.identityToken, name || undefined);
      onDone();
    } catch (err: any) {
      if (err?.code === "ERR_REQUEST_CANCELED" || err?.code === "ERR_CANCELED") return;
      onError(err instanceof Error ? err.message : "Apple sign-in failed.");
    }
  }

  return (
    <View style={{ gap: 10 }}>
      <Pressable
        style={({ pressed }) => [styles.button, styles.googleButton, pressed && styles.pressed]}
        onPress={handleGooglePress}
        disabled={!request || isGoogleBusy}
      >
        {isGoogleBusy ? (
          <ActivityIndicator size="small" color={colors.ink} />
        ) : (
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        )}
      </Pressable>

      {Platform.OS === "ios" && isAppleAvailable && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={radii.full}
          style={{ width: "100%", height: 46 }}
          onPress={handleApplePress}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
    paddingVertical: 13,
    borderWidth: 1,
  },
  googleButton: { backgroundColor: colors.surface, borderColor: colors.hairline },
  googleButtonText: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink },
  pressed: { opacity: 0.85 },
});
