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
import { colors, withAlpha } from "../theme";

export interface DocTypeMeta {
  label: string;
  icon: LucideIcon;
  color: string;
  badgeBg: string;
  badgeBorder: string;
}

function badge(color: string): Pick<DocTypeMeta, "badgeBg" | "badgeBorder"> {
  return {
    badgeBg: withAlpha(color, 0.06),
    badgeBorder: withAlpha(color, 0.25),
  };
}

const META: Record<DocType, DocTypeMeta> = {
  bill: { label: "Bill", icon: Receipt, color: "#2f6b5e", ...badge("#2f6b5e") },
  legal: { label: "Legal Document", icon: Scale, color: "#35415c", ...badge("#35415c") },
  error: { label: "Error Message", icon: AlertTriangle, color: "#8c3a3a", ...badge("#8c3a3a") },
  form: { label: "Form", icon: ClipboardList, color: "#8a6a2f", ...badge("#8a6a2f") },
  insurance: { label: "Insurance", icon: ShieldCheck, color: "#3b5570", ...badge("#3b5570") },
  website: { label: "Website", icon: Globe, color: "#6b4a6b", ...badge("#6b4a6b") },
  other: {
    label: "Document",
    icon: FileQuestion,
    color: colors.inkSoft,
    badgeBg: colors.hairlineSoft,
    badgeBorder: colors.hairline,
  },
};

export function getDocTypeMeta(docType: DocType): DocTypeMeta {
  return META[docType] ?? META.other;
}
