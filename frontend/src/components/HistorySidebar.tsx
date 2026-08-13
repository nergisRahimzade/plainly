import { useEffect, useRef, useState } from "react";
import { Search, X, Plus, Trash2 } from "lucide-react";
import type { PlainlyDocumentPublic } from "../types";
import { getDocTypeMeta } from "../lib/docTypeMeta";

const SEARCH_DEBOUNCE_MS = 1000;

interface HistorySidebarProps {
  documents: PlainlyDocumentPublic[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onSearch: (query: string) => void;
  onClearSearch: () => void;
  isSearchActive: boolean;
  onNewUpload: () => void;
}

export default function HistorySidebar({
  documents,
  selectedId,
  onSelect,
  onDelete,
  onSearch,
  onClearSearch,
  isSearchActive,
  onNewUpload,
}: HistorySidebarProps) {
  const [query, setQuery] = useState("");

  // Keep the latest callbacks in refs so the debounce effect only needs to
  // depend on `query` itself, not on new function references from re-renders.
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;
  const onClearSearchRef = useRef(onClearSearch);
  onClearSearchRef.current = onClearSearch;

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      if (isSearchActive) onClearSearchRef.current();
      return;
    }
    const handle = setTimeout(() => onSearchRef.current(trimmed), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <aside className="flex h-full w-full flex-col border-hairline bg-surface sm:border-r">
      <div className="px-6 pb-5 pt-7">
        <h1 className="font-serif text-2xl text-ink">Plainly</h1>
        <p className="mt-1 text-xs text-ink-faint">Upload it. Understand it.</p>

        <button
          onClick={onNewUpload}
          className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-accent"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          New screenshot
        </button>

        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const trimmed = query.trim();
                if (trimmed) onSearch(trimmed);
              }
            }}
            placeholder="Search your past uploads…"
            className="w-full border-b border-hairline bg-transparent py-2 pl-6 pr-6 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-accent"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                onClearSearch();
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {isSearchActive && (
          <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-accent">
            Semantic search results
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-6">
        {documents.length === 0 && (
          <p className="px-3 py-10 text-center text-sm leading-relaxed text-ink-faint">
            {isSearchActive ? "No matches found." : "Your explained screenshots will show up here."}
          </p>
        )}
        <ul className="space-y-0.5">
          {documents.map((doc) => {
            const meta = getDocTypeMeta(doc.docType);
            const Icon = meta.icon;
            const isSelected = doc.id === selectedId;
            return (
              <li key={doc.id}>
                <button
                  onClick={() => onSelect(doc.id)}
                  className={`group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    isSelected ? "bg-accent-soft" : "hover:bg-hairline-soft"
                  }`}
                >
                  <Icon
                    className="mt-0.5 h-3.5 w-3.5 shrink-0"
                    style={{ color: meta.color }}
                    strokeWidth={1.75}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium text-ink">{doc.title}</span>
                    <span className="block truncate text-xs text-ink-faint">{doc.summary}</span>
                  </span>
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(doc.id);
                    }}
                    className="mt-0.5 shrink-0 rounded p-1 text-ink-faint opacity-0 hover:text-brick group-hover:opacity-100"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
