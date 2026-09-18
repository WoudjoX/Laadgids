import type { Config } from "tailwindcss";

// Tokens uit DESIGN.md §2. Geen andere kleuren in components.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/copy/**/*.ts"],
  theme: {
    extend: {
      colors: {
        paper: "#FAF9F6",
        card: "#FFFFFF",
        ink: "#14213D",
        ink2: "#4A5568",
        ink3: "#8A94A6",
        line: "#E6E3DC",
        line2: "#CFCBC2",
        accent: "#C2410C",
        accentSoft: "#FDF0E8",
        ok: "#1F5F4A",
        okSoft: "#E6F1EC",
        warn: "#7A4B00",
        warnSoft: "#FBF1DC",
        bad: "#8B2C2C",
        badSoft: "#F9E8E8",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui"],
        mono: ["JetBrains Mono", "ui-monospace"],
      },
      borderRadius: { btn: "6px", card: "10px" },
      borderWidth: { hair: "0.5px" },
      maxWidth: { content: "720px" },
    },
  },
  plugins: [],
};

export default config;
