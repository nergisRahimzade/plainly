import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { Fraunces_500Medium, Fraunces_600SemiBold_Italic, Fraunces_600SemiBold } from "@expo-google-fonts/fraunces";

// Mirrors the web app's Tailwind theme tokens (frontend/src/index.css) so the
// mobile app feels like the same product, not a different app with the same API.
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
};

export const fonts = {
  sans: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
  sansSemiBold: "Inter_600SemiBold",
  sansBold: "Inter_700Bold",
  serif: "Fraunces_500Medium",
  serifSemiBold: "Fraunces_600SemiBold",
  serifItalic: "Fraunces_600SemiBold_Italic",
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const spacing = (n: number) => n * 4;

export function useAppFonts() {
  return useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_600SemiBold_Italic,
  });
}
