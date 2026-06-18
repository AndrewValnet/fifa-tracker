import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "var(--bg)",
        panel: "var(--surface)",
        panel2: "var(--surface-2)",
        edge: "var(--border)",
        ink: "var(--text)",
        dim: "var(--text-dim)",
        pitch: "var(--pitch)",
        live: "var(--live)",
        gold: "var(--gold)",
        sky: "var(--sky)",
        violet: "var(--violet)",
      },
      fontFamily: {
        display: ["var(--font-oswald)", "Arial Narrow", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-roboto-mono)", "ui-monospace", "monospace"],
      },
      maxWidth: {
        shell: "1280px",
      },
    },
  },
  plugins: [],
};
export default config;
