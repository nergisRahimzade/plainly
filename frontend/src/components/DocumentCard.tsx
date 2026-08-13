import ReactMarkdown from "react-markdown";
import { AlertTriangle, CheckCircle2, Link2, Sparkles } from "lucide-react";
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

  return (
    <div className="animate-fade-in rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${meta.badgeClass}`}>
            <Icon className="h-3.5 w-3.5" />
            {meta.label}
          </span>
          <span className="text-xs text-slate-400">
            {date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
      </div>

      <h2 className={`mt-4 text-2xl font-bold ${meta.headerClass}`}>{document.title}</h2>
      <p className="mt-1 text-sm italic text-slate-500">{document.summary}</p>

      {document.connections.length > 0 && (
        <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-violet-700">
            <Link2 className="h-4 w-4" /> Connected to your history
          </div>
          <ul className="mt-2 space-y-1 text-sm text-violet-800">
            {document.connections.map((c, i) => (
              <li key={i}>• {c}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-violet-600">
          <Sparkles className="h-4 w-4" /> In plain English
        </h3>
        <div className="prose prose-slate mt-2 max-w-none prose-p:my-2 prose-p:text-slate-700 prose-ul:my-2 prose-li:my-1 prose-li:text-slate-700 prose-strong:text-slate-900">
          <ReactMarkdown>{document.explanation}</ReactMarkdown>
        </div>
      </div>

      {document.redFlags.length > 0 && (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-rose-600">
            <AlertTriangle className="h-4 w-4" /> Pay attention to this
          </h3>
          <ul className="mt-2 space-y-1.5">
            {document.redFlags.map((flag, i) => (
              <li key={i} className="text-sm font-medium text-rose-700">
                • {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {document.actionItems.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-amber-700">
            <CheckCircle2 className="h-4 w-4" /> What you should do
          </h3>
          <ul className="mt-2 space-y-1.5">
            {document.actionItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm font-medium text-amber-900">
                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-amber-400 accent-amber-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {document.relatedTo.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <span className="text-xs font-semibold text-slate-400">Related uploads:</span>
          {document.relatedTo.map((r) => (
            <button
              key={r.id}
              onClick={() => onOpenRelated(r.id)}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
            >
              {r.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
