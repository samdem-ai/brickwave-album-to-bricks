import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        // Warm darkroom canvas
        ink: {
          950: "#0f0d0b",
          900: "#161311",
          850: "#1c1815",
          800: "#221d19",
          700: "#2c2620",
          600: "#3a322a",
        },
        paper: {
          DEFAULT: "#f6eedc",
          dim: "#e7d8b5",
          deep: "#d8c39a",
        },
        // Poster-grade brick accents
        brick: {
          red: "#e3000b",
          orange: "#f57c00",
          yellow: "#ffcd00",
          green: "#00852b",
          blue: "#0055bf",
          teal: "#069d9f",
          purple: "#812e9e",
          pink: "#e95da2",
        },
      },
      boxShadow: {
        brick: "0 4px 0 0 rgba(0,0,0,0.45), 0 6px 14px -4px rgba(0,0,0,0.5)",
        "brick-sm": "0 3px 0 0 rgba(0,0,0,0.4)",
        "brick-press": "0 1px 0 0 rgba(0,0,0,0.45)",
        frame:
          "0 2px 4px rgba(0,0,0,0.4), 0 18px 40px -12px rgba(0,0,0,0.7), inset 0 0 0 1px rgba(255,255,255,0.04)",
        sticker: "0 6px 18px -4px rgba(0,0,0,0.55)",
      },
      borderRadius: {
        brick: "14px",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        snap: "cubic-bezier(0.2, 0.9, 0.3, 1.4)",
      },
      keyframes: {
        "stud-pop": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "70%": { transform: "scale(1.12)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "sticker-pop": {
          "0%": { transform: "scale(0) rotate(-18deg)", opacity: "0" },
          "60%": { transform: "scale(1.18) rotate(6deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(-7deg)", opacity: "1" },
        },
        "fade-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        wiggle: {
          "0%,100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "sticker-pop": "sticker-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
        "fade-up": "fade-up 0.4s ease both",
        wiggle: "wiggle 0.4s ease-in-out",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
