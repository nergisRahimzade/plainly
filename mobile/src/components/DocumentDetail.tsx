import { useEffect, useState } from "react";
import { ScrollView, View, Text, StyleSheet, Pressable } from "react-native";
import Markdown from "react-native-markdown-display";
import { AlertTriangle, CheckCircle2, Link2, Check } from "lucide-react-native";
import type { PlainlyDocumentPublic } from "../types";
import { getDocTypeMeta } from "../lib/docTypeMeta";
import { colors, fonts, radii } from "../theme";

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
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <View style={[styles.badge, { borderColor: `${meta.color}40`, backgroundColor: meta.bg }]}>
          <Icon size={11} color={meta.color} strokeWidth={2} />
          <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label.toUpperCase()}</Text>
        </View>
        <Text style={styles.date}>
          {date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </Text>
      </View>

      <Text style={styles.title}>{document.title}</Text>
      <Text style={styles.summary}>{document.summary}</Text>

      {document.connections.length > 0 && (
        <View style={styles.connectionsBox}>
          <View style={styles.connectionsHeaderRow}>
            <View style={styles.connectionsIconWrap}>
              <Link2 size={11} color={colors.paper} strokeWidth={2.5} />
            </View>
            <Text style={styles.connectionsHeader}>CONNECTED TO YOUR HISTORY</Text>
          </View>
          {document.connections.map((c, i) => (
            <Text key={i} style={styles.connectionsText}>
              {c}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Markdown style={markdownStyles}>{document.explanation}</Markdown>
      </View>

      {document.redFlags.length > 0 && (
        <View style={styles.redFlagsBox}>
          <View style={styles.redFlagsHeaderRow}>
            <View style={styles.redFlagsIconWrap}>
              <AlertTriangle size={11} color={colors.paper} strokeWidth={2.5} />
            </View>
            <Text style={styles.redFlagsHeader}>PAY ATTENTION TO THIS</Text>
          </View>
          {document.redFlags.map((flag, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={styles.brickDot} />
              <Text style={styles.redFlagsText}>{flag}</Text>
            </View>
          ))}
        </View>
      )}

      {document.actionItems.length > 0 && (
        <View style={styles.actionBox}>
          <View style={styles.actionHeaderRow}>
            <CheckCircle2 size={12} color={colors.ochre} />
            <Text style={styles.actionHeader}>WHAT YOU SHOULD DO</Text>
          </View>
          {document.actionItems.map((item, i) => {
            const isChecked = checkedItems.has(i);
            return (
              <Pressable key={i} style={styles.actionRow} onPress={() => toggleItem(i)}>
                <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                  {isChecked && <Check size={11} color={colors.paper} strokeWidth={3} />}
                </View>
                <Text style={[styles.actionText, isChecked && styles.actionTextChecked]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {document.relatedTo.length > 0 && (
        <View style={styles.relatedRow}>
          <Text style={styles.relatedLabel}>Related uploads:</Text>
          <View style={styles.relatedChips}>
            {document.relatedTo.map((r) => (
              <Pressable key={r.id} style={styles.chip} onPress={() => onOpenRelated(r.id)}>
                <Text style={styles.chipText}>{r.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  badgeText: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, letterSpacing: 0.4 },
  date: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint },
  title: { fontFamily: fonts.serifSemiBold, fontSize: 26, color: colors.ink, marginTop: 14, lineHeight: 32 },
  summary: { fontFamily: fonts.sans, fontSize: 15, fontStyle: "italic", color: colors.inkSoft, marginTop: 6, lineHeight: 21 },

  section: { marginTop: 24, borderTopWidth: 1, borderTopColor: colors.hairline, paddingTop: 22 },

  connectionsBox: {
    marginTop: 26,
    backgroundColor: colors.accentSoft,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: `${colors.accent}4d`,
    padding: 16,
  },
  connectionsHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  connectionsIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  connectionsHeader: { fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 0.4, color: colors.accent },
  connectionsText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink, marginTop: 10, lineHeight: 20 },

  redFlagsBox: {
    marginTop: 26,
    backgroundColor: colors.brickSoft,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: `${colors.brick}99`,
    padding: 16,
  },
  redFlagsHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  redFlagsIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.brick,
    alignItems: "center",
    justifyContent: "center",
  },
  redFlagsHeader: { fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 0.4, color: colors.brick },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 10 },
  brickDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.brick, marginTop: 6 },
  redFlagsText: { flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink, lineHeight: 20 },

  actionBox: { marginTop: 26, borderLeftWidth: 2, borderLeftColor: `${colors.ochre}66`, paddingLeft: 16 },
  actionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionHeader: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 0.4, color: colors.ochre },
  actionRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 12 },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: colors.ochre, borderColor: colors.ochre },
  actionText: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: colors.ink, lineHeight: 20 },
  actionTextChecked: { color: colors.inkFaint, textDecorationLine: "line-through" },

  relatedRow: { marginTop: 28, borderTopWidth: 1, borderTopColor: colors.hairline, paddingTop: 18 },
  relatedLabel: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint, marginBottom: 8 },
  relatedChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.inkSoft },
});

const markdownStyles = StyleSheet.create({
  body: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink, lineHeight: 22 },
  bullet_list: { marginTop: 6 },
  list_item: { marginTop: 6 },
  strong: { fontFamily: fonts.sansSemiBold, color: colors.ink },
  paragraph: { marginTop: 0, marginBottom: 12 },
});
