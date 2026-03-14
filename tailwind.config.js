/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        "orange-primary": "#ee652b", //màu chính
        "orange-bg-heavy": "#fcede6", // màu nền đậm
        "orange-bg-light": "#fdfaf9", // màu nền nhạt
        "orange-border-light": "#fbe7df", // màu border nhạt
        "gray-primary": "#505050", // màu chữ chính
        "gray-border": "#EFF4F8",
        "gray-secondary": "#94a3b8",
        "blue-dark": "#0052cc",

        "green-primary": "#226262",
        "green-bg-heavy": "#D6F2F2",
        "green-bg-light": "#F4FFFF",
        "green-border-light": "#D6F2F2",
      },
    },
  },
  plugins: [],
};
