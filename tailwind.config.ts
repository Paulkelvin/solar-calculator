import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    colors: {
      white: "#ffffff",
      black: "#000000",
      transparent: "transparent",
      background: "#f5f5f5",
      foreground: "#111111",
      primary: {
        DEFAULT: "#10b981",
        foreground: "#ffffff"
      },
      secondary: {
        DEFAULT: "#f3f4f6",
        foreground: "#374151"
      },
      muted: {
        DEFAULT: "#f3f4f6",
        foreground: "#6b7280"
      },
      border: "#e5e7eb",
      ring: "#10b981",
      red: {
        500: "#ef4444"
      },
      green: {
        500: "#10b981"
      },
      gray: {
        50: "#f9fafb",
        100: "#f3f4f6",
        200: "#e5e7eb",
        300: "#d1d5db",
        400: "#9ca3af",
        500: "#6b7280",
        600: "#4b5563",
        700: "#374151",
        800: "#1f2937",
        900: "#111827"
      }
    },
    extend: {
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.25rem"
      }
    }
  },
  plugins: []
};

export default config;
