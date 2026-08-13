import { ScrollView, View, Text, StyleSheet, Pressable } from "react-native";
import Markdown from "react-native-markdown-display";
import type { PlainlyDocumentPublic } from "../types";
import { getDocTypeMeta } from "../lib/docTypeMeta";

interface DocumentDetailProps {
  document: PlainlyDocumentPublic;
  onOpenRelated: (id: string) => void;
}

export default function DocumentDetail({ document, onOpenRelated }: DocumentDetailProps) {
  const meta = getDocTypeMeta(document.docType);
  const date = new Date(document.createdAt);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <View style={[styles.badge, { backgroundColor: meta.bg }]}>
          <Text style={[styles.badgeText, { color: meta.color }]}>
            {meta.emoji} {meta.label}
          </Text>
        </View>
        <Text style={styles.date}>
          {date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </Text>
      </View>

      <Text style={[styles.title, { color: meta.color }]}>{document.title}</Text>
      <Text style={styles.summary}>{document.summary}</Text>

      {document.connections.length > 0 && (
        <View style={[styles.section, styles.connectionsBox]}>
          <Text style={styles.connectionsHeader}>🔗 Connected to your history</Text>
          {document.connections.map((c, i) => (
            <Text key={i} style={styles.connectionsText}>
              • {c}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>✨ IN PLAIN ENGLISH</Text>
        <Markdown style={markdownStyles}>{document.explanation}</Markdown>
      </View>

      {document.redFlags.length > 0 && (
        <View style={[styles.section, styles.redFlagsBox]}>
          <Text style={styles.redFlagsHeader}>⚠️ PAY ATTENTION TO THIS</Text>
          {document.redFlags.map((flag, i) => (
            <Text key={i} style={styles.redFlagsText}>
              • {flag}
            </Text>
          ))}
        </View>
      )}

      {document.actionItems.length > 0 && (
        <View style={[styles.section, styles.actionBox]}>
          <Text style={styles.actionHeader}>✅ WHAT YOU SHOULD DO</Text>
          {document.actionItems.map((item, i) => (
            <Text key={i} style={styles.actionText}>
              • {item}
            </Text>
          ))}
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
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: "700" },
  date: { fontSize: 12, color: "#94a3b8" },
  title: { fontSize: 24, fontWeight: "800", marginTop: 12 },
  summary: { fontSize: 13, color: "#64748b", fontStyle: "italic", marginTop: 4 },
  section: { marginTop: 20 },
  sectionHeader: { fontSize: 12, fontWeight: "800", color: "#7c3aed", letterSpacing: 0.5, marginBottom: 6 },
  connectionsBox: { backgroundColor: "#f5f3ff", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#ddd6fe" },
  connectionsHeader: { fontSize: 13, fontWeight: "700", color: "#6d28d9", marginBottom: 6 },
  connectionsText: { fontSize: 13, color: "#5b21b6", marginTop: 2 },
  redFlagsBox: { backgroundColor: "#fff1f2", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#fecdd3" },
  redFlagsHeader: { fontSize: 12, fontWeight: "800", color: "#e11d48", letterSpacing: 0.5, marginBottom: 6 },
  redFlagsText: { fontSize: 13, fontWeight: "600", color: "#be123c", marginTop: 4 },
  actionBox: { backgroundColor: "#fffbeb", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#fde68a" },
  actionHeader: { fontSize: 12, fontWeight: "800", color: "#b45309", letterSpacing: 0.5, marginBottom: 6 },
  actionText: { fontSize: 13, fontWeight: "600", color: "#92400e", marginTop: 4 },
  relatedRow: { marginTop: 20, borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 14 },
  relatedLabel: { fontSize: 11, fontWeight: "700", color: "#94a3b8", marginBottom: 6 },
  relatedChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { backgroundColor: "#f1f5f9", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { fontSize: 12, fontWeight: "600", color: "#475569" },
});

const markdownStyles = StyleSheet.create({
  body: { fontSize: 14, color: "#334155", lineHeight: 21 },
  bullet_list: { marginTop: 4 },
  list_item: { marginTop: 2 },
  strong: { color: "#0f172a" },
});
