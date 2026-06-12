// Pull shared color tokens from tailwind config to avoid hardcoded hex values.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const tailwindConfig = require("../tailwind.config.js");

type TailwindColors = Record<string, string>;

const colors: TailwindColors =
  tailwindConfig?.theme?.extend?.colors &&
  typeof tailwindConfig.theme.extend.colors === "object"
    ? (tailwindConfig.theme.extend.colors as TailwindColors)
    : {};

const getColor = (key: string, fallback: string) => {
  const value = colors[key];
  return typeof value === "string" ? value : fallback;
};

export const whColors = {
  primary: getColor("wh-green-primary", "#0d9488"),
  primaryHover: getColor("wh-green-primary-hover", "#0f766e"),
  primaryActive: getColor("wh-green-primary-active", "#115e59"),
  primaryLight: getColor("wh-green-primary-light", "#14b8a6"),
  bgHeavy: getColor("wh-green-bg-heavy", "#ccfbf1"),
  bgLight: getColor("wh-green-bg-light", "#f5f7fa"),
  bgMedium: getColor("wh-green-bg-medium", "#f0fdfa"),
  borderLight: getColor("wh-green-border-light", "#e2e8f0"),
  borderMedium: getColor("wh-green-border-medium", "#cbd5e1"),
  borderDark: getColor("wh-green-border-dark", "#0d9488"),
  textPrimary: getColor("wh-green-text-primary", "#1e293b"),
  textSecondary: getColor("wh-green-text-secondary", "#475569"),
  textMuted: getColor("wh-green-text-muted", "#94a3b8"),
  statusTodo: getColor("wh-status-todo", "#94a3b8"),
  statusInProgress: getColor("wh-status-inprogress", "#f59e0b"),
} as const;
