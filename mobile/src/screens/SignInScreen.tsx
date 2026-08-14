import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { AlertCircle, X } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useAuth } from "../context/AuthContext";
import SocialAuthButtons from "../components/SocialAuthButtons";
import { colors, fonts, radii } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "SignIn">;

export default function SignInScreen({ navigation }: Props) {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      await signInWithEmail(email.trim(), password);
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.topRow}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.closeButton}>
            <X size={18} color={colors.ink} />
          </Pressable>
        </View>

        <Text style={styles.eyebrow}>WELCOME BACK</Text>
        <Text style={styles.heading}>Sign in to Plainly</Text>
        <Text style={styles.subtitle}>Sync your history across devices.</Text>

        {error && (
          <View style={styles.errorBox}>
            <AlertCircle size={14} color={colors.brick} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={colors.inkFaint}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.inkFaint}
            secureTextEntry
            autoComplete="password"
            style={styles.input}
          />

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            onPress={handleSubmit}
            disabled={isSubmitting || !email || !password}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.paper} />
            ) : (
              <Text style={styles.primaryButtonText}>Sign In</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <SocialAuthButtons onDone={() => navigation.goBack()} onError={setError} />

        <Pressable style={styles.guestButton} onPress={() => navigation.goBack()}>
          <Text style={styles.guestButtonText}>Continue as guest</Text>
        </Pressable>

        <Pressable style={styles.switchRow} onPress={() => navigation.replace("SignUp")}>
          <Text style={styles.switchText}>
            Don't have an account? <Text style={styles.switchLink}>Sign up</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.paper, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  topRow: { alignItems: "flex-end" },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  eyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 2, color: colors.inkFaint, marginTop: 12 },
  heading: { fontFamily: fonts.serifSemiBold, fontSize: 30, color: colors.ink, marginTop: 8 },
  subtitle: { fontFamily: fonts.sans, fontSize: 14, color: colors.inkSoft, marginTop: 6 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 18,
    backgroundColor: colors.brickSoft,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: `${colors.brick}40`,
  },
  errorText: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 13, color: colors.brick },
  form: { marginTop: 24, gap: 12 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink,
  },
  primaryButton: {
    marginTop: 4,
    backgroundColor: colors.ink,
    borderRadius: radii.full,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.paper },
  pressed: { opacity: 0.85 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 26, marginBottom: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.hairline },
  dividerText: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint },
  guestButton: { marginTop: 18, alignItems: "center" },
  guestButtonText: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.inkSoft },
  switchRow: { marginTop: 22, alignItems: "center" },
  switchText: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.inkSoft },
  switchLink: { fontFamily: fonts.sansSemiBold, color: colors.accent },
});
