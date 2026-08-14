import { View, Text, Pressable, StyleSheet } from "react-native";
import { LogOut, User as UserIcon, Brain, ChevronRight } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { colors, fonts, radii } from "../theme";

interface AccountSectionProps {
  onSignInPress: () => void;
  onMemoriesPress: () => void;
}

export default function AccountSection({ onSignInPress, onMemoriesPress }: AccountSectionProps) {
  const { user, isAuthenticated, signOut } = useAuth();

  return (
    <View style={styles.wrap}>
      <Pressable style={({ pressed }) => [styles.memoriesRow, pressed && styles.pressed]} onPress={onMemoriesPress}>
        <Brain size={14} color={colors.inkSoft} />
        <Text style={styles.memoriesText}>What Plainly remembers</Text>
        <ChevronRight size={13} color={colors.inkFaint} />
      </Pressable>

      {isAuthenticated && user ? (
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user.name || user.email || "?").charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName} numberOfLines={1}>
              {user.name || "Plainly user"}
            </Text>
            {user.email && (
              <Text style={styles.userEmail} numberOfLines={1}>
                {user.email}
              </Text>
            )}
          </View>
          <Pressable onPress={signOut} hitSlop={8} style={styles.signOutButton}>
            <LogOut size={15} color={colors.inkSoft} />
          </Pressable>
        </View>
      ) : (
        <Pressable style={({ pressed }) => [styles.signInButton, pressed && styles.pressed]} onPress={onSignInPress}>
          <UserIcon size={14} color={colors.ink} />
          <Text style={styles.signInText}>Sign in</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  memoriesRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 2 },
  memoriesText: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 13, color: colors.inkSoft },
  userRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.accent },
  userName: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.ink },
  userEmail: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.inkFaint, marginTop: 1 },
  signOutButton: { padding: 6 },
  signInButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingVertical: 10,
  },
  pressed: { opacity: 0.85 },
  signInText: { fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.ink },
});
