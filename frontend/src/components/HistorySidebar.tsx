import { useState, type FormEvent } from "react";
import { Search, X, Sparkles, Trash2 } from "lucide-react";
import type { PlainlyDocumentPublic } from "../types";
import { getDocTypeMeta } from "../lib/docTypeMeta";

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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <aside className="flex h-full w-full flex-col border-slate-200 bg-white/60 sm:w-80 sm:border-r">
      <div className="p-5">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-violet-600 p-1.5">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Plainly</h1>
        </div>
        <p className="mt-1 text-xs text-slate-500">Upload it. Understand it.</p>

        <button
          onClick={onNewUpload}
          className="mt-4 w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700"
        >
          + New screenshot
        </button>

        <form onSubmit={handleSubmit} className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your past uploads…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm outline-none ring-violet-300 focus:ring-2"
          />
          {isSearchActive && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                onClearSearch();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>
        {isSearchActive && (
          <p className="mt-1.5 text-xs font-medium text-violet-600">Semantic search results</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-5">
        {documents.length === 0 && (
          <p className="px-2 py-8 text-center text-sm text-slate-400">
            {isSearchActive ? "No matches found." : "Your explained screenshots will show up here."}
          </p>
        )}
        <ul className="space-y-1">
          {documents.map((doc) => {
            const meta = getDocTypeMeta(doc.docType);
            const Icon = meta.icon;
            const isSelected = doc.id === selectedId;
            return (
              <li key={doc.id}>
                <button
                  onClick={() => onSelect(doc.id)}
                  className={`group flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    isSelected ? "bg-violet-100" : "hover:bg-slate-100"
                  }`}
                >
                  <span className={`mt-0.5 rounded-lg p-1.5 ${meta.badgeClass}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800">{doc.title}</span>
                    <span className="block truncate text-xs text-slate-500">{doc.summary}</span>
                  </span>
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(doc.id);
                    }}
                    className="mt-1 shrink-0 rounded p-1 text-slate-300 opacity-0 hover:text-rose-500 group-hover:opacity-100"
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
