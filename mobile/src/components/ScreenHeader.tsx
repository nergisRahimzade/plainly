import { View, Text, Pressable, StyleSheet } from "react-native";
import { Menu, ChevronLeft } from "lucide-react-native";
import { colors, fonts } from "../theme";

interface ScreenHeaderProps {
  onMenuPress: () => void;
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  right?: React.ReactNode;
}

export default function ScreenHeader({ onMenuPress, title, showBack, onBackPress, right }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {showBack ? (
          <Pressable style={styles.iconButton} onPress={onBackPress} hitSlop={8}>
            <ChevronLeft size={20} color={colors.ink} strokeWidth={2} />
          </Pressable>
        ) : (
          <Pressable style={styles.iconButton} onPress={onMenuPress} hitSlop={8}>
            <Menu size={18} color={colors.ink} strokeWidth={2} />
          </Pressable>
        )}
        <Text style={styles.title}>{title ?? "Plainly"}</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    backgroundColor: colors.paper,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  title: { fontFamily: fonts.serifSemiBold, fontSize: 18, color: colors.ink },
});
