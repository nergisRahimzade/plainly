import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Markdown from "react-native-markdown-display";
import { AlertTriangle, CheckCircle2, Link2 } from "lucide-react-native";
import type { PlainlyDocumentPublic } from "./types";
import { colors, fonts, getDocTypeMeta, withAlpha } from "./theme";

interface DocumentDetailProps {
  document: PlainlyDocumentPublic;
  onOpenRelated: (id: string) => void;
}

export default function DocumentDetail({ document, onOpenRelated }: DocumentDetailProps) {
  const meta = getDocTypeMeta(document.docType);
  const Icon = meta.icon;
  const date = new Date(document.createdAt);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    setCheckedItems(new Set());
  }, [document.id]);

  const toggleItem = (index: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <View>
      <View style={styles.headerRow}>
        <View style={[styles.badge, { backgroundColor: meta.badgeBg, borderColor: meta.badgeBorder }]}>
          <Icon size={12} color={meta.color} strokeWidth={2} />
          <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
        </View>
        <Text style={styles.date}>
          {date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </Text>
      </View>

      <Text style={styles.title}>{document.title}</Text>
      <Text style={styles.summary}>{document.summary}</Text>

      {document.connections.length > 0 && (
        <View style={styles.connectionsBox}>
          <View style={styles.calloutHeader}>
            <View style={[styles.calloutGlyph, { backgroundColor: colors.accent }]}>
              <Link2 size={12} color={colors.paper} strokeWidth={2.5} />
            </View>
            <Text style={[styles.calloutLabel, { color: colors.accent }]}>
              Connected to your history
            </Text>
          </View>
          <View style={styles.calloutList}>
            {document.connections.map((c, i) => (
              <Text key={i} style={styles.connectionText}>
                {c}
              </Text>
            ))}
          </View>
        </View>
      )}

      <View style={styles.explanation}>
        <Markdown style={markdownStyles}>{document.explanation}</Markdown>
      </View>

      {document.redFlags.length > 0 && (
        <View style={styles.redFlagsBox}>
          <View style={styles.calloutHeader}>
            <View style={[styles.calloutGlyph, { backgroundColor: colors.brick }]}>
              <AlertTriangle size={12} color={colors.paper} strokeWidth={2.5} />
            </View>
            <Text style={[styles.calloutLabel, { color: colors.brick }]}>Pay attention to this</Text>
          </View>
          <View style={styles.calloutList}>
            {document.redFlags.map((flag, i) => (
              <View key={i} style={styles.flagRow}>
                <View style={styles.flagDot} />
                <Text style={styles.flagText}>{flag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {document.actionItems.length > 0 && (
        <View style={styles.actionBox}>
          <View style={styles.actionHeader}>
            <CheckCircle2 size={12} color={colors.ochre} strokeWidth={2} />
            <Text style={styles.actionLabel}>What you should do</Text>
          </View>
          <View style={styles.calloutList}>
            {document.actionItems.map((item, i) => {
              const isChecked = checkedItems.has(i);
              return (
                <Pressable
                  key={i}
                  onPress={() => toggleItem(i)}
                  style={styles.checkRow}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isChecked }}
                >
                  <View style={[styles.checkbox, isChecked && styles.checkboxOn]}>
                    {isChecked && <View style={styles.checkboxMark} />}
                  </View>
                  <Text style={[styles.actionText, isChecked && styles.actionTextDone]}>{item}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {document.relatedTo.length > 0 && (
        <View style={styles.relatedRow}>
          <Text style={styles.relatedLabel}>Related uploads:</Text>
          <View style={styles.relatedChips}>
            {document.relatedTo.map((r) => (
              <Pressable
                key={r.id}
                onPress={() => onOpenRelated(r.id)}
                style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
              >
                <Text style={styles.chipText}>{r.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 11, fontWeight: "600", letterSpacing: 0.4, textTransform: "uppercase" },
  date: { fontSize: 12, color: colors.inkFaint },
  title: {
    marginTop: 16,
    fontFamily: fonts.serif,
    fontSize: 28,
    lineHeight: 34,
    color: colors.ink,
  },
  summary: {
    marginTop: 8,
    fontSize: 15,
    fontStyle: "italic",
    lineHeight: 22,
    color: colors.inkSoft,
  },
  connectionsBox: {
    marginTop: 28,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: withAlpha(colors.accent, 0.3),
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  redFlagsBox: {
    marginTop: 28,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: withAlpha(colors.brick, 0.6),
    backgroundColor: colors.brickSoft,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  calloutHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  calloutGlyph: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  calloutLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  calloutList: { marginTop: 12, gap: 8 },
  connectionText: { fontSize: 14, fontWeight: "500", lineHeight: 20, color: colors.ink },
  flagRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  flagDot: {
    marginTop: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brick,
  },
  flagText: { flex: 1, fontSize: 14, fontWeight: "600", lineHeight: 20, color: colors.ink },
  explanation: {
    marginTop: 32,
    paddingTop: 28,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  actionBox: {
    marginTop: 28,
    borderLeftWidth: 2,
    borderLeftColor: withAlpha(colors.ochre, 0.4),
    paddingLeft: 16,
  },
  actionHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: colors.ochre,
  },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  checkbox: {
    marginTop: 3,
    width: 14,
    height: 14,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: colors.ochre, borderColor: colors.ochre },
  checkboxMark: {
    width: 7,
    height: 4,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: colors.paper,
    transform: [{ rotate: "-45deg" }, { translateY: -1 }],
  },
  actionText: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.ink },
  actionTextDone: {
    color: colors.inkFaint,
    textDecorationLine: "line-through",
    textDecorationStyle: "solid",
  },
  relatedRow: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  relatedLabel: { fontSize: 12, color: colors.inkFaint },
  relatedChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  chipPressed: { borderColor: colors.accentHairline },
  chipText: { fontSize: 12, fontWeight: "500", color: colors.inkSoft },
});

const markdownStyles = StyleSheet.create({
  body: { fontSize: 15, color: colors.ink, lineHeight: 24 },
  paragraph: { marginTop: 12, marginBottom: 12, fontSize: 15, lineHeight: 24, color: colors.ink },
  bullet_list: { marginTop: 12, marginBottom: 12 },
  list_item: { marginVertical: 6 },
  bullet_list_icon: { color: colors.ink, marginRight: 8 },
  strong: { fontWeight: "600", color: colors.ink },
});
