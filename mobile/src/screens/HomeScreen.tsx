import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Alert, ScrollView, Pressable } from "react-native";
import { ShieldCheck, AlertCircle, MessageCircle } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import ScreenHeader from "../components/ScreenHeader";
import Sidebar from "../components/Sidebar";
import UploadZone from "../components/UploadZone";
import DocumentDetail from "../components/DocumentDetail";
import AccountSection from "../components/AccountSection";
import {
  deleteDocument,
  getDocument,
  listDocuments,
  searchDocuments,
  seedExampleDocuments,
  uploadDocument,
} from "../lib/api";
import type { PlainlyDocumentPublic } from "../types";
import { colors, fonts } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const [documents, setDocuments] = useState<PlainlyDocumentPublic[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<PlainlyDocumentPublic | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddingExamples, setIsAddingExamples] = useState(false);

  useEffect(() => {
    refreshHistory();
  }, []);

  async function refreshHistory() {
    try {
      setDocuments(await listDocuments());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load history.");
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
    const base64 = asset.base64;
    const mimeType = asset.mimeType || "image/jpeg";

    setIsAnalyzing(true);
    try {
      const doc = await uploadDocument(base64, mimeType);
      setSelectedDoc(doc);
      setDocuments((prev) => [doc, ...prev]);
      setIsSearchActive(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong analyzing that image.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleSelect(id: string) {
    setError(null);
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

  async function handleSearch(q: string) {
    setQuery(q);
    setIsSearchActive(true);
    setError(null);
    try {
      setDocuments(await searchDocuments(q));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
    }
  }

  function handleClearSearch() {
    setQuery("");
    setIsSearchActive(false);
    refreshHistory();
  }

  async function handleAddExamples() {
    setError(null);
    setIsAddingExamples(true);
    try {
      await seedExampleDocuments();
      await refreshHistory();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not add example documents. Make sure the backend and MongoDB are reachable."
      );
    } finally {
      setIsAddingExamples(false);
    }
  }

  return (
    <View style={styles.safe}>
      <ScreenHeader
        onMenuPress={() => setIsSidebarOpen(true)}
        showBack={!!selectedDoc}
        onBackPress={() => setSelectedDoc(null)}
        title={selectedDoc ? undefined : "Plainly"}
        right={
          <Pressable style={styles.chatButton} onPress={() => navigation.navigate("Chat")} hitSlop={8}>
            <MessageCircle size={16} color={colors.ink} />
          </Pressable>
        }
      />

      {error && (
        <View style={styles.errorBox}>
          <AlertCircle size={14} color={colors.brick} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {selectedDoc ? (
        <DocumentDetail document={selectedDoc} onOpenRelated={handleSelect} />
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.eyebrow}>PLAINLY</Text>
          <Text style={styles.heading}>
            Confused by{"\n"}something? <Text style={styles.headingItalic}>Upload it.</Text>
          </Text>
          <Text style={styles.tagline}>
            Bills, error messages, legal fine print, insurance letters, forms — Plainly explains it
            in plain English, with the important parts quietly highlighted.
          </Text>

          <View style={{ marginTop: 24 }}>
            <UploadZone
              onTakePhoto={() => handlePickImage(true)}
              onChooseImage={() => handlePickImage(false)}
              isAnalyzing={isAnalyzing}
            />
          </View>

          <View style={styles.privacyRow}>
            <ShieldCheck size={13} color={colors.inkFaint} style={{ marginTop: 1 }} />
            <Text style={styles.privacyNote}>
              Plainly never stores account numbers, IDs, or other sensitive numbers — only what the
              document means.
            </Text>
          </View>
        </ScrollView>
      )}

      <Sidebar
        visible={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        documents={documents}
        selectedId={selectedDoc?.id ?? null}
        onSelect={handleSelect}
        onDelete={handleDelete}
        onSearch={handleSearch}
        onClearSearch={handleClearSearch}
        isSearchActive={isSearchActive}
        onNewUpload={() => setSelectedDoc(null)}
        onAddExamples={handleAddExamples}
        isAddingExamples={isAddingExamples}
        footer={
          <AccountSection
            onSignInPress={() => {
              setIsSidebarOpen(false);
              navigation.navigate("SignIn");
            }}
            onMemoriesPress={() => {
              setIsSidebarOpen(false);
              navigation.navigate("Memories");
            }}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  chatButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  body: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 48 },
  eyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 2, color: colors.inkFaint },
  heading: { fontFamily: fonts.serifSemiBold, fontSize: 34, color: colors.ink, marginTop: 10, lineHeight: 40 },
  headingItalic: { fontFamily: fonts.serifItalic, color: colors.accent },
  tagline: { fontFamily: fonts.sans, fontSize: 15, color: colors.inkSoft, marginTop: 14, lineHeight: 22 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: colors.brickSoft,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: `${colors.brick}40`,
  },
  errorText: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 13, color: colors.brick },
  privacyRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 28,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    paddingTop: 18,
  },
  privacyNote: { flex: 1, fontFamily: fonts.sans, fontSize: 12, color: colors.inkFaint, lineHeight: 17 },
});
