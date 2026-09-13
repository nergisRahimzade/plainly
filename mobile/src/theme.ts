import { Platform } from "react-native";
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
import type { DocType } from "./types";

/** Same tokens as frontend/src/index.css */
export const colors = {
  paper: "#faf8f5",
  surface: "#ffffff",
  ink: "#221f1c",
  inkSoft: "#6f6a62",
  inkFaint: "#a39d92",
  hairline: "#e7e2d9",
  hairlineSoft: "#f0ece4",
  accent: "#3d3153",
  accentSoft: "#efeaf2",
  accentHairline: "#ddd3e4",
  brick: "#8c3a3a",
  brickSoft: "#f5e9e7",
  ochre: "#8a6a2f",
} as const;

export function withAlpha(hex: string, alpha: number) {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// System serif stands in for the web's Fraunces — RN would need bundled font files.
export const fonts = {
  sans: Platform.select({ ios: "System", android: "sans-serif", default: "system-ui" }) as string,
  serif: Platform.select({
    ios: "Iowan Old Style",
    android: "serif",
    default: "Georgia",
  }) as string,
};

export const SIDEBAR_WIDTH = 336;
export const WIDE_BREAKPOINT = 640;

export interface DocTypeMeta {
  label: string;
  icon: LucideIcon;
  color: string;
  badgeBg: string;
  badgeBorder: string;
}

function badge(color: string): Pick<DocTypeMeta, "badgeBg" | "badgeBorder"> {
  return { badgeBg: withAlpha(color, 0.06), badgeBorder: withAlpha(color, 0.25) };
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
