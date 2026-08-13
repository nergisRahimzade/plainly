import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { AlertTriangle, CheckCircle2, Link2 } from "lucide-react";
import type { PlainlyDocumentPublic } from "../types";
import { getDocTypeMeta } from "../lib/docTypeMeta";

interface DocumentCardProps {
  document: PlainlyDocumentPublic;
  onOpenRelated: (id: string) => void;
}

export default function DocumentCard({ document, onOpenRelated }: DocumentCardProps) {
  const meta = getDocTypeMeta(document.docType);
  const Icon = meta.icon;
  const date = new Date(document.createdAt);

  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  // Reset the checklist whenever a different document is opened.
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
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${meta.badgeClass}`}
        >
          <Icon className="h-3 w-3" strokeWidth={2} />
          {meta.label}
        </span>
        <span className="text-xs text-ink-faint">
          {date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </div>

      <h2 className="mt-4 font-serif text-3xl leading-tight text-ink">{document.title}</h2>
      <p className="mt-2 text-[15px] italic leading-relaxed text-ink-soft">{document.summary}</p>

      {document.connections.length > 0 && (
        <div className="mt-7 rounded-xl border-2 border-accent/30 bg-accent-soft px-5 py-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-accent">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-paper">
              <Link2 className="h-3 w-3" strokeWidth={2.5} />
            </span>
            Connected to your history
          </div>
          <ul className="mt-3 space-y-2">
            {document.connections.map((c, i) => (
              <li key={i} className="text-sm font-medium leading-relaxed text-ink">
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 border-t border-hairline pt-7">
        <div className="prose prose-slate max-w-none prose-p:my-3 prose-p:text-[15px] prose-p:leading-relaxed prose-p:text-ink prose-ul:my-3 prose-li:my-1.5 prose-li:text-[15px] prose-li:leading-relaxed prose-li:text-ink prose-strong:font-semibold prose-strong:text-ink">
          <ReactMarkdown>{document.explanation}</ReactMarkdown>
        </div>
      </div>

      {document.redFlags.length > 0 && (
        <div className="mt-7 rounded-xl border-2 border-brick/60 bg-brick-soft px-5 py-4 shadow-[0_1px_0_0_rgba(140,58,58,0.15)]">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brick">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brick text-paper">
              <AlertTriangle className="h-3 w-3" strokeWidth={2.5} />
            </span>
            Pay attention to this
          </div>
          <ul className="mt-3 space-y-2">
            {document.redFlags.map((flag, i) => (
              <li key={i} className="flex items-start gap-2 text-sm font-semibold leading-relaxed text-ink">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brick" />
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {document.actionItems.length > 0 && (
        <div className="mt-7 border-l-2 border-ochre/40 pl-4">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ochre">
            <CheckCircle2 className="h-3 w-3" /> What you should do
          </div>
          <ul className="mt-2.5 space-y-2">
            {document.actionItems.map((item, i) => {
              const isChecked = checkedItems.has(i);
              return (
                <li key={i}>
                  <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-relaxed">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleItem(i)}
                      className="mt-1 h-3.5 w-3.5 shrink-0 rounded-sm border-hairline accent-ochre"
                    />
                    <span
                      className={
                        isChecked ? "text-ink-faint line-through decoration-2" : "text-ink"
                      }
                    >
                      {item}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {document.relatedTo.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-hairline pt-6">
          <span className="text-xs text-ink-faint">Related uploads:</span>
          {document.relatedTo.map((r) => (
            <button
              key={r.id}
              onClick={() => onOpenRelated(r.id)}
              className="rounded-full border border-hairline px-3 py-1 text-xs font-medium text-ink-soft transition-colors hover:border-accent-hairline hover:text-accent"
            >
              {r.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
