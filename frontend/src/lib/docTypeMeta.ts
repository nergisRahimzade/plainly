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
  /** Deep, muted color used for icon glyphs and small accents. */
  color: string;
  /** Tailwind classes for a subtle outline badge in this doc type's color. */
  badgeClass: string;
}

const META: Record<DocType, DocTypeMeta> = {
  bill: {
    label: "Bill",
    icon: Receipt,
    color: "#2f6b5e",
    badgeClass: "text-[#2f6b5e] border-[#2f6b5e]/25 bg-[#2f6b5e]/[0.06]",
  },
  legal: {
    label: "Legal Document",
    icon: Scale,
    color: "#35415c",
    badgeClass: "text-[#35415c] border-[#35415c]/25 bg-[#35415c]/[0.06]",
  },
  error: {
    label: "Error Message",
    icon: AlertTriangle,
    color: "#8c3a3a",
    badgeClass: "text-[#8c3a3a] border-[#8c3a3a]/25 bg-[#8c3a3a]/[0.06]",
  },
  form: {
    label: "Form",
    icon: ClipboardList,
    color: "#8a6a2f",
    badgeClass: "text-[#8a6a2f] border-[#8a6a2f]/25 bg-[#8a6a2f]/[0.06]",
  },
  insurance: {
    label: "Insurance",
    icon: ShieldCheck,
    color: "#3b5570",
    badgeClass: "text-[#3b5570] border-[#3b5570]/25 bg-[#3b5570]/[0.06]",
  },
  website: {
    label: "Website",
    icon: Globe,
    color: "#6b4a6b",
    badgeClass: "text-[#6b4a6b] border-[#6b4a6b]/25 bg-[#6b4a6b]/[0.06]",
  },
  other: {
    label: "Document",
    icon: FileQuestion,
    color: "#6f6a62",
    badgeClass: "text-ink-soft border-hairline bg-hairline-soft",
  },
};

export function getDocTypeMeta(docType: DocType): DocTypeMeta {
  return META[docType] ?? META.other;
}
