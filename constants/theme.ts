import { Platform } from "react-native";

// COLORS
export const Colors = {
  light: {
    // Base
    text: "#1C1C1E",
    textSecondary: "#8E8E93",
    background: "#FFFFFF",
    backgroundSecondary: "#F2F2F7",

    // Orange Theme Colors (from index.css)
    orangePrimary: "#ee652b",
    orangeBgHeavy: "#fcede6",
    orangeBgLight: "#fdfaf9",
    orangeBorderLight: "#fbe7df",
    grayPrimary: "#505050",
    graySecondary: "#94a3b8",
    blueDark: "#0052cc",

    // Switch colors
    switchTrackOn: "#ee652b", // Màu cam khi bật
    switchTrackOff: "#E5E5EA", // Màu xám nhạt khi tắt
    switchThumb: "#FFFFFF", // Nút tròn màu trắng

    // Primary - Zalo-like blue
    primary: "#0068FF",
    primaryLight: "#E6F2FF",
    primaryDark: "#0052CC",

    // Status
    success: "#34C759",
    warning: "#FF9500",
    error: "#FF3B30",
    info: "#007AFF",

    // Chat specific
    chatBubbleSent: "#0068FF",
    chatBubbleReceived: "#F0F0F0",
    chatBubbleTextSent: "#FFFFFF",
    chatBubbleTextReceived: "#000000",

    // UI
    border: "#E5E5EA",
    divider: "#E5E5EA",
    card: "#FFFFFF",
    shadow: "rgba(0, 0, 0, 0.1)",

    // Status indicators
    online: "#34C759",
    offline: "#8E8E93",

    // Tabs
    tabIconDefault: "#8E8E93",
    tabIconSelected: "#0068FF",
    tabBarBackground: "#FFFFFF",
  },
  dark: {
    // Base
    text: "#FFFFFF",
    textSecondary: "#98989D",
    background: "#000000",
    backgroundSecondary: "#1C1C1E",

    // Orange Theme Colors (darker variants for dark mode)
    orangePrimary: "#EE652B",
    orangeBgHeavy: "#FCEDE6",
    orangeBgLight: "#FDFAF9",
    orangeBorderLight: "#FBE7DF",
    grayPrimary: "#e5e5e5",
    graySecondary: "#a8b4c8",
    blueDark: "#0a84ff",

    // Switch colors
    switchTrackOn: "#EE652B", // Màu cam khi bật (sáng hơn cho dark mode)
    switchTrackOff: "#94A3B8", // Màu xám đậm khi tắt
    switchThumb: "#FFFFFF", // Nút tròn màu trắng

    // Primary
    primary: "#0A84FF",
    primaryLight: "#1F3A5F",
    primaryDark: "#0068CC",

    // Status
    success: "#32D74B",
    warning: "#FF9F0A",
    error: "#FF453A",
    info: "#0A84FF",

    // Chat specific
    chatBubbleSent: "#0A84FF",
    chatBubbleReceived: "#2C2C2E",
    chatBubbleTextSent: "#FFFFFF",
    chatBubbleTextReceived: "#FFFFFF",

    // UI
    border: "#38383A",
    divider: "#38383A",
    card: "#1C1C1E",
    shadow: "rgba(0, 0, 0, 0.3)",

    // Status
    online: "#32D74B",
    offline: "#98989D",

    // Tabs
    tabIconDefault: "#98989D",
    tabIconSelected: "#0A84FF",
    tabBarBackground: "#1C1C1E",
  },
};

// FONT SIZES
export const FontSizes = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
};

// SPACING
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
};

// BORDER RADIUS
export const BorderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

// SHADOWS
export const Shadows = {
  small: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    android: {
      elevation: 2,
    },
  }),
  medium: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
    },
    android: {
      elevation: 4,
    },
  }),
  large: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
    },
    android: {
      elevation: 8,
    },
  }),
};

// LAYOUT
export const Layout = {
  window: {
    width: 0, // Set in runtime
    height: 0,
  },
  headerHeight: 56,
  tabBarHeight: 50,
  inputHeight: 44,
  buttonHeight: 48,
  avatarSize: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 72,
  },
};

// TYPOGRAPHY
export const Typography = {
  h1: {
    fontSize: FontSizes.xxxl,
    fontWeight: "700" as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: FontSizes.xxl,
    fontWeight: "700" as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: FontSizes.xl,
    fontWeight: "600" as const,
    lineHeight: 28,
  },
  body: {
    fontSize: FontSizes.base,
    fontWeight: "400" as const,
    lineHeight: 20,
  },
  bodyBold: {
    fontSize: FontSizes.base,
    fontWeight: "600" as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: FontSizes.sm,
    fontWeight: "400" as const,
    lineHeight: 16,
  },
  small: {
    fontSize: FontSizes.xs,
    fontWeight: "400" as const,
    lineHeight: 14,
  },
};
