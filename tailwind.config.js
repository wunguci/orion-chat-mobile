/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        "orange-primary": "#ee652b",
        "orange-bg-heavy": "#fcede6",
        "orange-bg-light": "#fdfaf9",
        "orange-border-light": "#fbe7df",
        "gray-primary": "#505050",
        "gray-border": "#EFF4F8",
        "gray-secondary": "#94a3b8",
        "blue-dark": "#0052cc",
        "green-primary": "#226262",
        "green-bg-heavy": "#D6F2F2",
        "green-bg-light": "#F4FFFF",
        "green-border-light": "#D6F2F2",
        "wh-green-primary": "#0d9488",
        "wh-green-primary-hover": "#0f766e",
        "wh-green-primary-active": "#115e59",
        "wh-green-primary-light": "#14b8a6",
        "wh-green-bg-heavy": "#ccfbf1",
        "wh-green-bg-light": "#f5f7fa",
        "wh-green-bg-medium": "#f0fdfa",
        "wh-green-border-light": "#e2e8f0",
        "wh-green-border-medium": "#cbd5e1",
        "wh-green-border-dark": "#0d9488",
        "wh-green-text-primary": "#1e293b",
        "wh-green-text-secondary": "#475569",
        "wh-green-text-muted": "#94a3b8",
        "wh-status-todo": "#94a3b8",
        "wh-status-inprogress": "#f59e0b",

        // test colors
        "teal-primary": "#14b8a6",
        "teal-dark": "#0d9488",
        "teal-light": "#ccfbf1",

        green: {
          primary: "#226262",
          bgHeavy: "#D6F2F2",
          bgLight: "#F4FFFF",
          borderLight: "#D6F2F2",
          online: "#22c55e",
        },

        gray: {
          light: "#f1f5f9",
          text: "#64748b",
        },

        badge: {
          blue: "#3b82f6",
        },

        teal: {
          primary: "#14b8a6",
          dark: "#0d9488",
          light: "#ccfbf1",
        },
      },
    },
    plugins: [],
  },
};
