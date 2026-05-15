import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "midnight-navy":   "#0F172A",
        "medical-blue":    "#3B82F6",
        "emergency-red":   "#EF4444",
        "warning-amber":   "#F59E0B",
        "ghost-white":     "#F8FAFC",
        "slate-gray":      "#475569",

        surface: {
          DEFAULT:                 "#fcf8fa",
          dim:                     "#dcd9db",
          bright:                  "#fcf8fa",
          "container-lowest":      "#ffffff",
          "container-low":         "#f6f3f5",
          container:               "#f0edef",
          "container-high":        "#eae7e9",
          "container-highest":     "#e4e2e4",
          variant:                 "#e4e2e4",
          tint:                    "#565e74",
        },

        "on-surface":              "#1b1b1d",
        "on-surface-variant":      "#45464d",
        "inverse-surface":         "#303032",
        "inverse-on-surface":      "#f3f0f2",

        outline:                   "#76777d",
        "outline-variant":         "#c6c6cd",

        primary: {
          DEFAULT:                 "#000000",
          container:               "#131b2e",
          fixed:                   "#dae2fd",
          "fixed-dim":             "#bec6e0",
        },
        "on-primary":              "#ffffff",
        "on-primary-container":    "#7c839b",
        "on-primary-fixed":        "#131b2e",
        "on-primary-fixed-variant":"#3f465c",
        "inverse-primary":         "#bec6e0",

        secondary: {
          DEFAULT:                 "#0058be",
          container:               "#2170e4",
          fixed:                   "#d8e2ff",
          "fixed-dim":             "#adc6ff",
        },
        "on-secondary":            "#ffffff",
        "on-secondary-container":  "#fefcff",
        "on-secondary-fixed":      "#001a42",
        "on-secondary-fixed-variant": "#004395",

        tertiary: {
          DEFAULT:                 "#000000",
          container:               "#271901",
          fixed:                   "#fcdeb5",
          "fixed-dim":             "#dec29a",
        },
        "on-tertiary":             "#ffffff",
        "on-tertiary-container":   "#98805d",
        "on-tertiary-fixed":       "#271901",
        "on-tertiary-fixed-variant": "#574425",

        error: {
          DEFAULT:                 "#ba1a1a",
          container:               "#ffdad6",
        },
        "on-error":                "#ffffff",
        "on-error-container":      "#93000a",
      },

      fontFamily: {
        sans:  ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono:  ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
        label: ["Space Grotesk", "ui-sans-serif", "sans-serif"],
        headline: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        body:     ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },

      fontSize: {
        "headline-lg": ["2rem",     { lineHeight: "1.2", fontWeight: "700" }],
        "headline-md": ["1.5rem",   { lineHeight: "1.3", fontWeight: "600" }],
        "body-lg":     ["1rem",     { lineHeight: "1.5", fontWeight: "400" }],
        "body-sm":     ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }],
        "data-mono":   ["0.875rem", { lineHeight: "1.4", fontWeight: "500", letterSpacing: "-0.02em" }],
        "label-caps":  ["0.75rem",  { lineHeight: "1",   fontWeight: "600" }],
      },

      borderRadius: {
        sm:      "0.125rem",
        DEFAULT: "0.25rem",
        md:      "0.375rem",
        lg:      "0.5rem",
        xl:      "0.75rem",
        full:    "9999px",
      },

      spacing: {
        "touch-min":      "3rem",
        gutter:           "1rem",
        "margin-mobile":  "1.5rem",
        "margin-desktop": "2rem",
        "widget-gap":     "1.25rem",
      },

      boxShadow: {
        card:      "0 2px 4px rgba(0,0,0,0.08)",
        "card-md": "0 4px 8px rgba(0,0,0,0.10)",
        "card-lg": "0 8px 24px rgba(0,0,0,0.12)",
        sidebar:   "2px 0 8px rgba(15,23,42,0.15)",
      },

      gap: {
        gutter:       "1rem",
        "widget-gap": "1.25rem",
      },

      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { transform: "translateX(-100%)" },
          to:   { transform: "translateX(0)" },
        },
        "pulse-stat": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.7" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to:   { transform: "translateY(0)" },
        },
      },

      animation: {
        "fade-in":    "fade-in 0.2s ease-out",
        "slide-in":   "slide-in 0.25s ease-out",
        "pulse-stat": "pulse-stat 1.5s ease-in-out infinite",
        "slide-up":   "slide-up 0.3s cubic-bezier(0.32,0.72,0,1)",
      },
    },
  },
  plugins: [],
};

export default config;
