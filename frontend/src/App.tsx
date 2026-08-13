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
    <div className="flex h-screen w-screen overflow-hidden bg-paper">
      <div
        className={`fixed inset-0 z-20 bg-ink/20 backdrop-blur-[2px] sm:hidden ${isSidebarOpen ? "block" : "hidden"}`}
        onClick={() => setIsSidebarOpen(false)}
      />
      <div
        className={`fixed inset-y-0 left-0 z-30 w-80 max-w-[85vw] transform transition-transform duration-300 ease-out sm:static sm:z-auto sm:w-[21rem] sm:translate-x-0 ${
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
        <div className="mx-auto max-w-2xl px-6 py-10 sm:px-12 sm:py-16">
          <button
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-hairline bg-surface px-3.5 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:border-accent-hairline hover:text-accent sm:hidden"
            onClick={() => setIsSidebarOpen((v) => !v)}
          >
            {isSidebarOpen ? <X className="h-3.5 w-3.5" /> : <Menu className="h-3.5 w-3.5" />}
            History
          </button>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-brick/25 bg-brick-soft px-4 py-3 text-sm font-medium text-brick">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {!selectedDoc || isAnalyzing ? (
            <>
              <div className="mb-10">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink-faint">Plainly</p>
                <h2 className="mt-3 font-serif text-4xl leading-[1.15] text-ink sm:text-[2.75rem]">
                  Confused by something?
                  <br />
                  <span className="italic text-accent">Upload it.</span>
                </h2>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft">
                  Bills, error messages, legal fine print, insurance letters, forms — Plainly explains
                  it in plain English, with the important parts quietly highlighted.
                </p>
              </div>
              <UploadZone onSelectImage={handleSelectImage} isAnalyzing={isAnalyzing} />
            </>
          ) : (
            <DocumentCard document={selectedDoc} onOpenRelated={handleSelectDoc} />
          )}

          <div className="mt-12 flex items-start gap-2 border-t border-hairline pt-6 text-xs leading-relaxed text-ink-faint">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Plainly never stores account numbers, IDs, or other sensitive numbers — only what the
            document means.
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
