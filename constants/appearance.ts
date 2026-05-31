import { ColorSchemeName } from "react-native";
import { Colors } from "@/constants/theme";

export const APPEARANCE_STORAGE_KEY = "orion_chat_appearance_settings";

export const APPEARANCE_COLORS = {
  green: {
    primary: "#226262",
    primaryHover: "#004444",
    primaryBg: "#D6F2F2",
    surfaceBg: "#F4FFFF",
    border: "#D6F2F2",
    message: "#007c7c",
  },
  teal: {
    primary: "#2ab3b3",
    primaryHover: "#168787",
    primaryBg: "#D8F5F5",
    surfaceBg: "#F4FFFF",
    border: "#C8EEEE",
    message: "#2ab3b3",
  },
  orange: {
    primary: "#ee652b",
    primaryHover: "#c74c18",
    primaryBg: "#fcede6",
    surfaceBg: "#fdfaf9",
    border: "#fbe7df",
    message: "#ee652b",
  },
  blue: {
    primary: "#0068ff",
    primaryHover: "#0052cc",
    primaryBg: "#e6f2ff",
    surfaceBg: "#f6fbff",
    border: "#cfe5ff",
    message: "#0068ff",
  },
  purple: {
    primary: "#6366f1",
    primaryHover: "#4f46e5",
    primaryBg: "#ececff",
    surfaceBg: "#fbfaff",
    border: "#ddd6fe",
    message: "#6366f1",
  },
  red: {
    primary: "#ab2346",
    primaryHover: "#881337",
    primaryBg: "#fde8ee",
    surfaceBg: "#fff8fa",
    border: "#f8c9d6",
    message: "#ab2346",
  },
  gray: {
    primary: "#505050",
    primaryHover: "#303030",
    primaryBg: "#edf0f4",
    surfaceBg: "#f8fafc",
    border: "#d8dee8",
    message: "#505050",
  },
} as const;

export type AppearanceColor = keyof typeof APPEARANCE_COLORS;
export type AppearanceThemeMode = "light" | "dark" | "system" | "auto";

export type AppearanceSettings = {
  theme: AppearanceThemeMode;
  appearanceColor: AppearanceColor;
  wallpaper?: string;
  fontSize?: number;
};

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  theme: "light",
  appearanceColor: "green",
  wallpaper: "teal",
  fontSize: 16,
};

export const WALLPAPER_APPEARANCE_COLOR_MAP: Record<string, AppearanceColor> = {
  teal: "teal",
  orange: "orange",
  purple: "purple",
  green: "green",
  red: "red",
  gray: "gray",
  "light-gray": "gray",
  blue: "blue",
};

export function normalizeAppearanceColor(
  appearanceColor?: string | null,
): AppearanceColor {
  const normalized = (appearanceColor || "green").trim().toLowerCase();
  return normalized in APPEARANCE_COLORS
    ? (normalized as AppearanceColor)
    : "green";
}

export function normalizeAppearanceTheme(
  theme?: string | null,
): AppearanceThemeMode {
  const normalized = (theme || "light").trim().toLowerCase();
  if (
    normalized === "light" ||
    normalized === "dark" ||
    normalized === "system" ||
    normalized === "auto"
  ) {
    return normalized;
  }

  return "light";
}

export function getAppearanceColorFromWallpaper(
  wallpaper?: string | null,
): AppearanceColor {
  return WALLPAPER_APPEARANCE_COLOR_MAP[wallpaper || ""] || "green";
}

export function resolveAppearanceColorScheme(
  theme: AppearanceThemeMode,
  systemScheme: ColorSchemeName,
): "light" | "dark" {
  if (theme === "dark") return "dark";
  if (theme === "system" || theme === "auto") {
    return systemScheme === "dark" ? "dark" : "light";
  }

  return "light";
}

export function buildAppearanceColors(
  settings: AppearanceSettings,
  systemScheme: ColorSchemeName,
) {
  const colorScheme = resolveAppearanceColorScheme(settings.theme, systemScheme);
  const isDark = colorScheme === "dark";
  const base = Colors[colorScheme];
  const palette = APPEARANCE_COLORS[settings.appearanceColor];

  return {
    ...base,
    background: isDark ? "#142322" : palette.surfaceBg,
    backgroundSecondary: isDark ? "#111827" : palette.primaryBg,
    card: isDark ? "#111827" : "#FFFFFF",
    border: isDark ? `${palette.primary}66` : palette.border,
    divider: isDark ? `${palette.primary}40` : palette.border,
    primary: palette.primary,
    primaryLight: isDark ? `${palette.primary}2E` : palette.primaryBg,
    primaryDark: palette.primaryHover,
    tabIconSelected: palette.primary,
    chatBubbleSent: palette.message,
    switchTrackOn: palette.primary,
    orangePrimary: palette.primary,
    orangeBgHeavy: isDark ? `${palette.primary}2E` : palette.primaryBg,
    orangeBgLight: isDark ? "#142322" : palette.surfaceBg,
    orangeBorderLight: isDark ? `${palette.primary}66` : palette.border,
    blueDark: palette.primaryHover,
  };
}
