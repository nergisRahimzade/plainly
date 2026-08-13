import {
  Receipt,
  Scale,
  AlertTriangle,
  ClipboardList,
  ShieldCheck,
  Globe,
  FileQuestion,
  type LucideIcon,
} from "lucide-react";
import type { DocType } from "../types";

export interface DocTypeMeta {
  label: string;
  icon: LucideIcon;
  badgeClass: string;
  headerClass: string;
}

const META: Record<DocType, DocTypeMeta> = {
  bill: {
    label: "Bill",
    icon: Receipt,
    badgeClass: "bg-emerald-100 text-emerald-700",
    headerClass: "text-emerald-700",
  },
  legal: {
    label: "Legal Document",
    icon: Scale,
    badgeClass: "bg-indigo-100 text-indigo-700",
    headerClass: "text-indigo-700",
  },
  error: {
    label: "Error Message",
    icon: AlertTriangle,
    badgeClass: "bg-rose-100 text-rose-700",
    headerClass: "text-rose-700",
  },
  form: {
    label: "Form",
    icon: ClipboardList,
    badgeClass: "bg-amber-100 text-amber-700",
    headerClass: "text-amber-700",
  },
  insurance: {
    label: "Insurance",
    icon: ShieldCheck,
    badgeClass: "bg-sky-100 text-sky-700",
    headerClass: "text-sky-700",
  },
  website: {
    label: "Website",
    icon: Globe,
    badgeClass: "bg-fuchsia-100 text-fuchsia-700",
    headerClass: "text-fuchsia-700",
  },
  other: {
    label: "Document",
    icon: FileQuestion,
    badgeClass: "bg-slate-200 text-slate-700",
    headerClass: "text-slate-700",
  },
};

export function getDocTypeMeta(docType: DocType): DocTypeMeta {
  return META[docType] ?? META.other;
}
