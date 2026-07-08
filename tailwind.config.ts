import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#10243E", 800: "#16304F", 700: "#1D3D63", 600: "#24496F" },
        ocean: { DEFAULT: "#0E7C86", 600: "#0C6B74", 100: "#DCF1F3", 50: "#EFF9FA" },
        sand: "#F5F7FA",
        coral: "#E2725B",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
