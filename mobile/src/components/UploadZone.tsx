import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { UploadCloud, Camera, Image as ImageIcon } from "lucide-react-native";
import { colors, fonts, radii } from "../theme";

interface UploadZoneProps {
  onTakePhoto: () => void;
  onChooseImage: () => void;
  isAnalyzing: boolean;
}

export default function UploadZone({ onTakePhoto, onChooseImage, isAnalyzing }: UploadZoneProps) {
  return (
    <View style={[styles.card, isAnalyzing && styles.cardAnalyzing]}>
      {isAnalyzing ? (
        <>
          <ActivityIndicator size="small" color={colors.accent} />
          <View style={{ alignItems: "center" }}>
            <Text style={styles.title}>Reading your screenshot</Text>
            <Text style={styles.subtitle}>This usually takes a few seconds.</Text>
          </View>
        </>
      ) : (
        <>
          <View style={styles.iconCircle}>
            <UploadCloud size={20} color={colors.inkSoft} strokeWidth={1.5} />
          </View>
          <View style={{ alignItems: "center", paddingHorizontal: 8 }}>
            <Text style={styles.title}>Take a photo or choose a screenshot</Text>
            <Text style={styles.subtitle}>
              Bills, error messages, legal docs, insurance letters, forms — anything confusing.
            </Text>
          </View>
          <View style={styles.actionsRow}>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              onPress={onTakePhoto}
            >
              <Camera size={15} color={colors.paper} strokeWidth={2} />
              <Text style={styles.primaryButtonText}>Take Photo</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
              onPress={onChooseImage}
            >
              <ImageIcon size={15} color={colors.ink} strokeWidth={2} />
              <Text style={styles.secondaryButtonText}>Choose Image</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    gap: 14,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  cardAnalyzing: { borderStyle: "solid" },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.ink, textAlign: "center" },
  subtitle: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkFaint, textAlign: "center", marginTop: 4, lineHeight: 18 },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 4, width: "100%" },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.ink,
    borderRadius: radii.full,
    paddingVertical: 12,
  },
  primaryButtonText: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.paper },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingVertical: 12,
  },
  secondaryButtonText: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.ink },
  pressed: { opacity: 0.85 },
});
