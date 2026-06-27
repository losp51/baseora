import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",   // next-themes "class" attribute ile çalışır
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          blue: "#0052FF",
          "blue-dark": "#0039CC",
          "blue-light": "#3374FF",
        },
        bg: {
          primary: "#0A0B0D",
          secondary: "#111318",
          tertiary: "#1A1D24",
        },
        border: {
          DEFAULT: "#252830",
          hover: "rgba(0, 82, 255, 0.25)",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#8B8FA8",
          muted: "#4A4E65",
        },
        success: "#00C896",
        warning: "#FFB547",
        error: "#FF4D6A",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        card: "16px",
        input: "12px",
        btn: "8px",
      },
      backgroundImage: {
        "gradient-base": "linear-gradient(135deg, #0052FF 0%, #00C2FF 100%)",
        "gradient-card": "linear-gradient(180deg, #111318 0%, #0A0B0D 100%)",
        "gradient-blue-glow":
          "radial-gradient(ellipse at center, rgba(0,82,255,0.15) 0%, transparent 70%)",
      },
      animation: {
        shimmer: "shimmer 2s infinite linear",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  safelist: [
    // bg colors
    "bg-bg-primary", "bg-bg-secondary", "bg-bg-tertiary",
    "bg-base-blue", "bg-base-blue-dark", "bg-base-blue-light",
    "bg-success", "bg-warning", "bg-error",
    // text colors
    "text-text-primary", "text-text-secondary", "text-text-muted",
    "text-base-blue", "text-base-blue-light", "text-success", "text-warning", "text-error",
    // border colors
    "border-border", "border-base-blue",
    // gradients
    "bg-gradient-base", "bg-gradient-card",
  ],
  plugins: [],
};

export default config;
