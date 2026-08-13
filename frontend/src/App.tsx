import { useEffect, useState } from "react";
import { ShieldCheck, AlertCircle, Menu, X } from "lucide-react";
import UploadZone from "./components/UploadZone";
import DocumentCard from "./components/DocumentCard";
import HistorySidebar from "./components/HistorySidebar";
import {
  deleteDocument,
  getDocument,
  listDocuments,
  searchDocuments,
  uploadDocument,
} from "./lib/api";
import type { PlainlyDocumentPublic } from "./types";

function App() {
  const [documents, setDocuments] = useState<PlainlyDocumentPublic[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<PlainlyDocumentPublic | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    listDocuments()
      .then(setDocuments)
      .catch((err) => setError(err.message));
  }, []);

  const handleSelectImage = async (imageBase64: string, mimeType: string) => {
    setError(null);
    setIsAnalyzing(true);
    try {
      const doc = await uploadDocument(imageBase64, mimeType);
      setSelectedDoc(doc);
      setDocuments((prev) => [doc, ...prev]);
      setIsSearchActive(false);
      setIsSidebarOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectDoc = async (id: string) => {
    setError(null);
    setIsSidebarOpen(false);
    const cached = documents.find((d) => d.id === id);
    if (cached) setSelectedDoc(cached);
    try {
      const full = await getDocument(id);
      setSelectedDoc(full);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load that document.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (selectedDoc?.id === id) setSelectedDoc(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete that document.");
    }
  };

  const handleSearch = async (query: string) => {
    setError(null);
    setIsSearchActive(true);
    try {
      const results = await searchDocuments(query);
      setDocuments(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
    }
  };

  const handleClearSearch = async () => {
    setIsSearchActive(false);
    try {
      setDocuments(await listDocuments());
    } catch {
      // keep existing list on failure
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f6f5fb]">
      <div
        className={`fixed inset-0 z-20 bg-black/30 sm:hidden ${isSidebarOpen ? "block" : "hidden"}`}
        onClick={() => setIsSidebarOpen(false)}
      />
      <div
        className={`fixed inset-y-0 left-0 z-30 w-80 max-w-[85vw] transform transition-transform sm:static sm:z-auto sm:w-80 sm:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <HistorySidebar
          documents={documents}
          selectedId={selectedDoc?.id ?? null}
          onSelect={handleSelectDoc}
          onDelete={handleDelete}
          onSearch={handleSearch}
          onClearSearch={handleClearSearch}
          isSearchActive={isSearchActive}
          onNewUpload={() => setSelectedDoc(null)}
        />
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-10">
          <button
            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 sm:hidden"
            onClick={() => setIsSidebarOpen((v) => !v)}
          >
            {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            History
          </button>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {!selectedDoc || isAnalyzing ? (
            <>
              <div className="mb-6 text-center sm:text-left">
                <h2 className="text-3xl font-extrabold text-slate-900">
                  Confused by something? <span className="text-violet-600">Upload it.</span>
                </h2>
                <p className="mt-2 text-slate-500">
                  Bills, error messages, legal fine print, insurance letters, forms — Plainly explains
                  it in plain English, with the important stuff highlighted.
                </p>
              </div>
              <UploadZone onSelectImage={handleSelectImage} isAnalyzing={isAnalyzing} />
            </>
          ) : (
            <DocumentCard document={selectedDoc} onOpenRelated={handleSelectDoc} />
          )}

          <div className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-slate-400 sm:justify-start">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Plainly never stores account numbers, IDs, or other sensitive numbers — only what the
            document means.
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
