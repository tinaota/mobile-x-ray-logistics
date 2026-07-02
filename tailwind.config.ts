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
        "blue-tint":       "#eff5ff",
        "green-ink":       "#14633a",
        "green-tint":      "#effaf2",
        "warning-amber-ink":  "#92560a",
        "warning-amber-tint": "#fef6e7",

        // Refined Prototype Color Palette
        "surface-container-low": "#f5f2ff",
        "on-surface-variant": "#464555",
        "tertiary-container": "#a44100",
        "tertiary-fixed-dim": "#ffb695",
        "surface-container": "#f0ecf9",
        "acuity-high": "#DC2626",
        "radiology-indigo-deep": "#312E81",
        "secondary-container": "#e21e49",
        "radiology-indigo": "#4F46E5",
        "radiology-slate-blue": "#475569",
        "error-container": "#ffdad6",
        "acuity-medium": "#D97706",
        "surface-container-high": "#eae6f4",
        "acuity-low": "#2563EB",
        "surface-bright": "#fcf8ff",
        "surface-tint": "#4d44e3",
        "surface-container-highest": "#e4e1ee",
        "primary-fixed": "#e2dfff",
        "secondary-fixed": "#ffdada",
        "secondary-fixed-dim": "#ffb3b6",
        "surface-container-lowest": "#ffffff",
        "tertiary-fixed": "#ffdbcc",
        "surface-muted": "#F8FAFC",
        "border-subtle": "#E2E8F0",
        "laboratory-rose": "#E11D48",
        "surface-variant": "#e4e1ee",
        "primary-fixed-dim": "#c3c0ff",
        "primary-container": "#4f46e5",
        "laboratory-emerald": "#059669",

        surface: {
          DEFAULT:                 "#fcf8ff",
          dim:                     "#dcd8e5",
          bright:                  "#fcf8ff",
          "container-lowest":      "#ffffff",
          "container-low":         "#f5f2ff",
          "container":             "#f0ecf9",
          "container-high":        "#eae6f4",
          "container-highest":     "#e4e1ee",
          variant:                 "#e4e1ee",
          tint:                    "#4d44e3",
        },

        "on-surface":              "#1b1b24",
        "inverse-surface":         "#302f39",
        "inverse-on-surface":      "#f3effc",

        outline:                   "#777587",
        "outline-variant":         "#c7c4d8",

        primary: {
          DEFAULT:                 "#3525cd",
          container:               "#4f46e5",
          fixed:                   "#e2dfff",
          "fixed-dim":             "#c3c0ff",
        },
        "on-primary":              "#ffffff",
        "on-primary-container":    "#dad7ff",
        "on-primary-fixed":        "#0f0069",
        "on-primary-fixed-variant":"#3323cc",
        "inverse-primary":         "#c3c0ff",

        secondary: {
          DEFAULT:                 "#ba0035",
          container:               "#e21e49",
          fixed:                   "#ffdada",
          "fixed-dim":             "#ffb3b6",
        },
        "on-secondary":            "#ffffff",
        "on-secondary-container":  "#fffbff",
        "on-secondary-fixed":      "#40000c",
        "on-secondary-fixed-variant": "#920028",

        tertiary: {
          DEFAULT:                 "#7e3000",
          container:               "#a44100",
          fixed:                   "#ffdbcc",
          "fixed-dim":             "#ffb695",
        },
        "on-tertiary":             "#ffffff",
        "on-tertiary-container":   "#ffd2be",
        "on-tertiary-fixed":       "#351000",
        "on-tertiary-fixed-variant": "#7b2f00",

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
        headline: ["Hanken Grotesk", "Inter", "sans-serif"],
        body:     ["Inter", "sans-serif"],

        // Prototype Font Mappings
        "body-lg": ["Inter"],
        "body-md": ["Inter"],
        "headline-sm": ["Hanken Grotesk"],
        "headline-md": ["Hanken Grotesk"],
        "body-sm": ["Inter"],
        "status-countdown": ["JetBrains Mono"],
        "label-caps": ["JetBrains Mono"],
        "headline-lg": ["Hanken Grotesk"],
        "headline-lg-mobile": ["Hanken Grotesk"]
      },

      fontSize: {
        "headline-lg": ["2rem",     { lineHeight: "1.2", fontWeight: "700" }],
        "headline-md": ["1.5rem",   { lineHeight: "1.3", fontWeight: "600" }],
        "body-lg":     ["1rem",     { lineHeight: "1.5", fontWeight: "400" }],
        "body-sm":     ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }],
        "data-mono":   ["0.875rem", { lineHeight: "1.4", fontWeight: "500", letterSpacing: "-0.02em" }],
        "label-caps":  ["0.75rem",  { lineHeight: "1",   fontWeight: "600" }],

        // Prototype Font Sizes
        "fontSize-body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "fontSize-body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "fontSize-headline-sm": ["16px", { lineHeight: "24px", fontWeight: "600" }],
        "fontSize-headline-md": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "fontSize-body-sm": ["12px", { lineHeight: "16px", fontWeight: "400" }],
        "fontSize-status-countdown": ["14px", { lineHeight: "20px", fontWeight: "700" }],
        "fontSize-label-caps": ["11px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "600" }],
        "fontSize-headline-lg": ["24px", { lineHeight: "32px", fontWeight: "700" }],
        "fontSize-headline-lg-mobile": ["22px", { lineHeight: "28px", fontWeight: "700" }]
      },

      borderRadius: {
        sm:      "0.125rem",
        DEFAULT: "0.25rem",
        md:      "0.375rem",
        lg:      "0.5rem",
        xl:      "0.75rem",
        full:    "9999px",
        "proto-sm": "10px",
        "proto-md": "14px",
        "proto-lg": "20px",
        "proto-xl": "26px",
      },

      spacing: {
        "touch-min":      "3rem",
        gutter:           "1rem",
        "margin-mobile":  "1.5rem",
        "margin-desktop": "2rem",
        "widget-gap":     "1.25rem",

        // Prototype Spacing Keys
        "touch-target": "2.75rem",
        "safe-margin": "1rem",
        "stack-gap": "0.75rem",
        "section-padding": "1.5rem",
        "card-padding": "1rem"
      },

      boxShadow: {
        card:      "0 2px 4px rgba(0,0,0,0.08)",
        "card-md": "0 4px 8px rgba(0,0,0,0.10)",
        "card-lg": "0 8px 24px rgba(0,0,0,0.12)",
        sidebar:   "2px 0 8px rgba(15,23,42,0.15)",
        "proto-card": "0 1px 2px rgba(15,23,42,.05), 0 4px 14px rgba(15,23,42,.05)",
        "proto-pop":  "0 8px 30px rgba(15,23,42,.14)",
        "proto-fab":  "0 10px 24px rgba(59,130,246,.38)",
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
