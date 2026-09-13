import { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  useWindowDimensions,
  Platform,
  StatusBar as RNStatusBar,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { AlertCircle, Menu, ShieldCheck, X } from "lucide-react-native";
import DocumentDetail from "./src/DocumentDetail";
import HistorySidebar from "./src/HistorySidebar";
import UploadZone from "./src/UploadZone";
import {
  deleteDocument,
  getDocument,
  listDocuments,
  searchDocuments,
  uploadDocument,
} from "./src/api";
import type { PlainlyDocumentPublic } from "./src/types";
import { colors, fonts, SIDEBAR_WIDTH, WIDE_BREAKPOINT, withAlpha } from "./src/theme";

export default function App() {
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;

  const [documents, setDocuments] = useState<PlainlyDocumentPublic[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<PlainlyDocumentPublic | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    refreshHistory();
  }, []);

  async function refreshHistory() {
    setIsLoadingHistory(true);
    try {
      setDocuments(await listDocuments());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load history.");
    } finally {
      setIsLoadingHistory(false);
    }
  }

  async function handlePickImage(fromCamera: boolean) {
    setError(null);
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission needed", "Plainly needs access to continue.");
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7 });

    const asset = result.assets?.[0];
    if (result.canceled || !asset?.base64) return;

    setIsAnalyzing(true);
    try {
      const doc = await uploadDocument(asset.base64, asset.mimeType || "image/jpeg");
      setSelectedDoc(doc);
      setDocuments((prev) => [doc, ...prev]);
      setIsSearchActive(false);
      setIsSidebarOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong analyzing that image.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleSelect(id: string) {
    setError(null);
    setIsSidebarOpen(false);
    const cached = documents.find((d) => d.id === id);
    if (cached) setSelectedDoc(cached);
    try {
      setSelectedDoc(await getDocument(id));
    } catch (err) {
      if (!cached) setError(err instanceof Error ? err.message : "Could not open that document.");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (selectedDoc?.id === id) setSelectedDoc(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete that document.");
    }
  }

  async function handleSearch(query: string) {
    setIsSearchActive(true);
    setError(null);
    try {
      setDocuments(await searchDocuments(query));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
    }
  }

  const sidebar = (
    <HistorySidebar
      documents={documents}
      selectedId={selectedDoc?.id ?? null}
      onSelect={handleSelect}
      onDelete={handleDelete}
      onSearch={handleSearch}
      onClearSearch={() => {
        setIsSearchActive(false);
        refreshHistory();
      }}
      isSearchActive={isSearchActive}
      onNewUpload={() => {
        setSelectedDoc(null);
        setIsSidebarOpen(false);
      }}
      isLoading={isLoadingHistory}
    />
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.shell}>
        {isWide && <View style={styles.permanentSidebar}>{sidebar}</View>}

        <View style={styles.main}>
          <ScrollView
            contentContainerStyle={[styles.mainInner, isWide && styles.mainInnerWide]}
            keyboardShouldPersistTaps="handled"
          >
            {!isWide && (
              <Pressable
                onPress={() => setIsSidebarOpen((v) => !v)}
                style={({ pressed }) => [styles.historyBtn, pressed && styles.historyBtnPressed]}
              >
                {isSidebarOpen ? (
                  <X size={14} color={colors.inkSoft} />
                ) : (
                  <Menu size={14} color={colors.inkSoft} />
                )}
                <Text style={styles.historyBtnText}>History</Text>
              </Pressable>
            )}

            {error && (
              <View style={styles.errorBox}>
                <AlertCircle size={16} color={colors.brick} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {!selectedDoc || isAnalyzing ? (
              <>
                <View style={styles.hero}>
                  <Text style={styles.kicker}>Plainly</Text>
                  <Text style={styles.headline}>
                    Confused by something?{"\n"}
                    <Text style={styles.headlineAccent}>Upload it.</Text>
                  </Text>
                  <Text style={styles.lede}>
                    Bills, error messages, legal fine print, insurance letters, forms — Plainly
                    explains it in plain English, with the important parts quietly highlighted.
                  </Text>
                </View>
                <UploadZone
                  onPickCamera={() => handlePickImage(true)}
                  onPickLibrary={() => handlePickImage(false)}
                  isAnalyzing={isAnalyzing}
                />
              </>
            ) : (
              <DocumentDetail document={selectedDoc} onOpenRelated={handleSelect} />
            )}

            <View style={styles.privacy}>
              <ShieldCheck size={14} color={colors.inkFaint} style={styles.privacyIcon} />
              <Text style={styles.privacyText}>
                Plainly never stores account numbers, IDs, or other sensitive numbers — only what
                the document means.
              </Text>
            </View>
          </ScrollView>
        </View>

        {!isWide && isSidebarOpen && (
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <Pressable style={styles.backdrop} onPress={() => setIsSidebarOpen(false)} />
            <View style={[styles.drawer, { width: Math.min(SIDEBAR_WIDTH, width * 0.85) }]}>
              {sidebar}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingTop: Platform.OS === "android" ? RNStatusBar.currentHeight ?? 0 : 0,
  },
  shell: { flex: 1, flexDirection: "row" },
  permanentSidebar: {
    width: SIDEBAR_WIDTH,
    borderRightWidth: 1,
    borderRightColor: colors.hairline,
    backgroundColor: colors.surface,
  },
  main: { flex: 1 },
  mainInner: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  mainInnerWide: {
    maxWidth: 672,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 48,
    paddingTop: 48,
    paddingBottom: 64,
  },
  historyBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  historyBtnPressed: { borderColor: colors.accentHairline },
  historyBtnText: { fontSize: 14, fontWeight: "500", color: colors.inkSoft },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: withAlpha(colors.brick, 0.25),
    backgroundColor: colors.brickSoft,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorText: { flex: 1, fontSize: 14, fontWeight: "500", color: colors.brick },
  hero: { marginBottom: 40 },
  kicker: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 3.2,
    textTransform: "uppercase",
    color: colors.inkFaint,
  },
  headline: {
    marginTop: 12,
    fontFamily: fonts.serif,
    fontSize: 34,
    lineHeight: 40,
    color: colors.ink,
  },
  headlineAccent: { fontFamily: fonts.serif, fontStyle: "italic", color: colors.accent },
  lede: { marginTop: 16, maxWidth: 420, fontSize: 15, lineHeight: 24, color: colors.inkSoft },
  privacy: {
    marginTop: 48,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  privacyIcon: { marginTop: 2 },
  privacyText: { flex: 1, fontSize: 12, lineHeight: 18, color: colors.inkFaint },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: withAlpha(colors.ink, 0.2),
    zIndex: 20,
  },
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.hairline,
    zIndex: 30,
    elevation: 8,
  },
});
