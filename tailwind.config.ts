import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          ink: "#07101d",
          panel: "#101826",
          panel2: "#131d2b",
          line: "#253247",
          violet: "#7c5cff",
          cyan: "#58d9e8",
          mint: "#67d79f",
          amber: "#e9b35b",
          rose: "#e9758b"
        }
      },
      boxShadow: {
        "studio-soft": "0 24px 60px -32px rgba(0, 0, 0, 0.7)",
        "studio-inset": "inset 0 1px 0 rgba(255,255,255,0.08)"
      },
      fontFamily: {
        sans: [
          "Geist",
          "Avenir Next",
          "Hiragino Sans",
          "Yu Gothic",
          "ui-sans-serif",
          "system-ui",
          "sans-serif"
        ],
        mono: [
          "Geist Mono",
          "SFMono-Regular",
          "ui-monospace",
          "Menlo",
          "monospace"
        ]
      }
    }
  },
  plugins: []
};

export default config;
