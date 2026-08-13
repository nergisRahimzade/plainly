import type { DocType } from "../types";

export interface DocTypeMeta {
  label: string;
  emoji: string;
  color: string;
  bg: string;
}

const META: Record<DocType, DocTypeMeta> = {
  bill: { label: "Bill", emoji: "🧾", color: "#047857", bg: "#d1fae5" },
  legal: { label: "Legal Document", emoji: "⚖️", color: "#4338ca", bg: "#e0e7ff" },
  error: { label: "Error Message", emoji: "⚠️", color: "#be123c", bg: "#ffe4e6" },
  form: { label: "Form", emoji: "📋", color: "#b45309", bg: "#fef3c7" },
  insurance: { label: "Insurance", emoji: "🛡️", color: "#0369a1", bg: "#e0f2fe" },
  website: { label: "Website", emoji: "🌐", color: "#a21caf", bg: "#fae8ff" },
  other: { label: "Document", emoji: "📄", color: "#475569", bg: "#e2e8f0" },
};

export function getDocTypeMeta(docType: DocType): DocTypeMeta {
  return META[docType] ?? META.other;
}
