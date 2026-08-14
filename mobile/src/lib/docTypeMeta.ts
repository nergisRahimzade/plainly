import {
  Receipt,
  Scale,
  AlertTriangle,
  ClipboardList,
  ShieldCheck,
  Globe,
  FileQuestion,
  type LucideIcon,
} from "lucide-react-native";
import type { DocType } from "../types";
import { colors } from "../theme";

export interface DocTypeMeta {
  label: string;
  icon: LucideIcon;
  /** Deep, muted color used for icon glyphs and small accents — matches the web app exactly. */
  color: string;
  /** Soft tint used behind badges/icon chips. */
  bg: string;
}

const META: Record<DocType, DocTypeMeta> = {
  bill: { label: "Bill", icon: Receipt, color: "#2f6b5e", bg: "#2f6b5e0f" },
  legal: { label: "Legal Document", icon: Scale, color: "#35415c", bg: "#35415c0f" },
  error: { label: "Error Message", icon: AlertTriangle, color: "#8c3a3a", bg: "#8c3a3a0f" },
  form: { label: "Form", icon: ClipboardList, color: "#8a6a2f", bg: "#8a6a2f0f" },
  insurance: { label: "Insurance", icon: ShieldCheck, color: "#3b5570", bg: "#3b55700f" },
  website: { label: "Website", icon: Globe, color: "#6b4a6b", bg: "#6b4a6b0f" },
  other: { label: "Document", icon: FileQuestion, color: colors.inkSoft, bg: colors.hairlineSoft },
};

export function getDocTypeMeta(docType: DocType): DocTypeMeta {
  return META[docType] ?? META.other;
}
