import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // keeping this small on purpose - blue/yellow/white comes mostly
        // from stock tailwind blue-* and yellow-* classes below
        paper: "#F5F8FF",
        ink: "#0F2A4A",
        line: "#D7E3F5",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};
export default config;
