import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Camera, Image as ImageIcon, UploadCloud } from "lucide-react-native";
import { colors, fonts } from "../theme";

interface UploadZoneProps {
  onPickCamera: () => void;
  onPickLibrary: () => void;
  isAnalyzing: boolean;
}

export default function UploadZone({ onPickCamera, onPickLibrary, isAnalyzing }: UploadZoneProps) {
  return (
    <View style={[styles.zone, isAnalyzing && styles.zoneAnalyzing]}>
      {isAnalyzing ? (
        <>
          <ActivityIndicator size="large" color={colors.accent} />
          <View>
            <Text style={styles.analyzingTitle}>Reading your screenshot</Text>
            <Text style={styles.analyzingSub}>This usually takes a few seconds.</Text>
          </View>
        </>
      ) : (
        <>
          <View style={styles.iconCircle}>
            <UploadCloud size={20} color={colors.inkSoft} strokeWidth={1.5} />
          </View>
          <View>
            <Text style={styles.title}>Take a photo, or choose a screenshot</Text>
            <Text style={styles.subtitle}>
              Bills, error messages, legal docs, insurance letters, forms — anything confusing.
            </Text>
          </View>
          <View style={styles.actions}>
            <Pressable
              onPress={onPickCamera}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryPressed]}
            >
              <Camera size={14} color={colors.paper} strokeWidth={2.5} />
              <Text style={styles.primaryText}>Take photo</Text>
            </Pressable>
            <Pressable
              onPress={onPickLibrary}
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.secondaryPressed]}
            >
              <ImageIcon size={14} color={colors.inkSoft} strokeWidth={2.5} />
              <Text style={styles.secondaryText}>Choose image</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 28,
    paddingVertical: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
  },
  zoneAnalyzing: {
    borderStyle: "solid",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.sans,
    fontSize: 15,
    fontWeight: "500",
    color: colors.ink,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkFaint,
    textAlign: "center",
  },
  analyzingTitle: {
    fontFamily: fonts.serif,
    fontSize: 18,
    color: colors.ink,
    textAlign: "center",
  },
  analyzingSub: {
    marginTop: 4,
    fontSize: 14,
    color: colors.inkFaint,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 4,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.ink,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryPressed: { backgroundColor: colors.accent },
  primaryText: { color: colors.paper, fontSize: 13, fontWeight: "500" },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  secondaryPressed: { borderColor: colors.accentHairline },
  secondaryText: { color: colors.inkSoft, fontSize: 13, fontWeight: "500" },
});
