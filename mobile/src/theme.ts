import { Platform } from "react-native";

/** Visual tokens mirrored from frontend/src/index.css */
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
  ochreSoft: "#f6f0e1",
} as const;

export const withAlpha = (hex: string, alpha: number) => {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Closest native stand-ins for the web's Inter / Fraunces pairing.
 * RN cannot load those webfonts without extra font assets; system serif
 * (Iowan Old Style / Palatino / Georgia) keeps the editorial contrast.
 */
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
export const SEARCH_DEBOUNCE_MS = 1000;
