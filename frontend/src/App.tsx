import { useEffect, useState } from "react";
import { ShieldCheck, AlertCircle, Menu, X, PlayCircle } from "lucide-react";
import UploadZone from "./components/UploadZone";
import DocumentCard from "./components/DocumentCard";
import HistorySidebar from "./components/HistorySidebar";
import {
  deleteDocument,
  getDocument,
  listDocuments,
  searchDocuments,
  seedExampleDocuments,
  uploadDocument,
} from "./lib/api";
import {
  getDemoDocument,
  getDemoDocuments,
  removeDemoDocument,
  searchDemoDocuments,
  simulateUpload,
} from "./lib/demoStore";
import { getStoredExampleIds, setStoredExampleIds } from "./lib/exampleDocs";
import type { PlainlyDocumentPublic } from "./types";

// Live calls that fail (wifi drops, backend down, API quota hit, etc.) should
// never leave a presenter/user staring at a dead error screen — they silently
// fall back into demo mode instead, so the app always has something to show.
const UNREACHABLE_MESSAGE =
  "We couldn't reach the live server, so you're viewing sample data instead. Nothing below is real.";

function App() {
  const [documents, setDocuments] = useState<PlainlyDocumentPublic[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<PlainlyDocumentPublic | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoReason, setDemoReason] = useState<string | null>(null);
  const [isAddingExamples, setIsAddingExamples] = useState(false);

  const enterDemoMode = (reason: string | null) => {
    setIsDemoMode(true);
    setDemoReason(reason);
    setError(null);
    setIsSearchActive(false);
    setDocuments(getDemoDocuments());
    setSelectedDoc(null);
  };

  useEffect(() => {
    listDocuments()
      .then(setDocuments)
      .catch(() => enterDemoMode(UNREACHABLE_MESSAGE));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleDemoMode = () => {
    if (isDemoMode) {
      setIsDemoMode(false);
      setDemoReason(null);
      setSelectedDoc(null);
      setError(null);
      listDocuments()
        .then(setDocuments)
        .catch(() => enterDemoMode(UNREACHABLE_MESSAGE));
    } else {
      enterDemoMode(null);
    }
  };

  const handleSelectImage = async (imageBase64: string, mimeType: string) => {
    setError(null);
    setIsAnalyzing(true);
    try {
      if (isDemoMode) {
        const doc = await simulateUpload();
        setSelectedDoc(doc);
        setDocuments((prev) => [doc, ...prev]);
        setIsSearchActive(false);
        setIsSidebarOpen(false);
        return;
      }
      const doc = await uploadDocument(imageBase64, mimeType);
      setSelectedDoc(doc);
      setDocuments((prev) => [doc, ...prev]);
      setIsSearchActive(false);
      setIsSidebarOpen(false);
    } catch (err) {
      // Live analysis failed — fall back to a canned result rather than a dead end.
      enterDemoMode("Live analysis is unavailable right now, so here's a sample result instead.");
      try {
        const doc = await simulateUpload();
        setSelectedDoc(doc);
        setDocuments((prev) => [doc, ...prev]);
      } catch {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectDoc = async (id: string) => {
    setError(null);
    setIsSidebarOpen(false);
    if (isDemoMode) {
      const doc = getDemoDocument(id);
      if (doc) setSelectedDoc(doc);
      return;
    }
    const cached = documents.find((d) => d.id === id);
    if (cached) setSelectedDoc(cached);
    try {
      const full = await getDocument(id);
      setSelectedDoc(full);
    } catch (err) {
      if (!cached) setError(err instanceof Error ? err.message : "Could not load that document.");
    }
  };

  const handleDelete = async (id: string) => {
    if (isDemoMode) {
      removeDemoDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      if (selectedDoc?.id === id) setSelectedDoc(null);
      return;
    }
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
    if (isDemoMode) {
      setDocuments(searchDemoDocuments(query));
      return;
    }
    try {
      const results = await searchDocuments(query);
      setDocuments(results);
    } catch {
      // Search unreachable — fall back to a simple local text match over the
      // demo dataset so search still visibly works during a live demo.
      enterDemoMode("Live search is unavailable right now, so you're viewing sample data.");
      setDocuments(searchDemoDocuments(query));
      setIsSearchActive(true);
    }
  };

  const handleClearSearch = async () => {
    setIsSearchActive(false);
    if (isDemoMode) {
      setDocuments(getDemoDocuments());
      return;
    }
    try {
      setDocuments(await listDocuments());
    } catch {
      // keep existing list on failure
    }
  };

  // Populates the current user's REAL history with curated example documents
  // via the real API (real Mongo records, real embeddings) — for demoing the
  // app when everything is working, as opposed to the offline fallback demo.
  const handleAddExampleDocuments = async () => {
    setError(null);
    setIsAddingExamples(true);
    try {
      const previousIds = getStoredExampleIds();
      if (previousIds.length > 0) {
        await Promise.all(previousIds.map((id) => deleteDocument(id).catch(() => {})));
      }
      const created = await seedExampleDocuments();
      setStoredExampleIds(created.map((d) => d.id));
      setDocuments(await listDocuments());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not add example documents. Make sure the backend and MongoDB are reachable."
      );
    } finally {
      setIsAddingExamples(false);
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
          isDemoMode={isDemoMode}
          onToggleDemoMode={handleToggleDemoMode}
          onAddExamples={handleAddExampleDocuments}
          isAddingExamples={isAddingExamples}
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

          {isDemoMode && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent-hairline bg-accent-soft px-4 py-3 text-sm text-accent">
              <span className="flex items-center gap-2">
                <PlayCircle className="h-4 w-4 shrink-0" />
                {demoReason ??
                  "Demo mode — everything below is a sample. No live calls are being made."}
              </span>
              <button
                onClick={handleToggleDemoMode}
                className="shrink-0 font-semibold underline decoration-2 underline-offset-2 hover:text-ink"
              >
                Exit demo
              </button>
            </div>
          )}

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
