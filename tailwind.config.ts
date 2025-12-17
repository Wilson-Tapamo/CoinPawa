import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // 1. COLORS: "Dark Mode Only" Deep Palette
      colors: {
        background: {
          DEFAULT: "#0B0E14", // Main App BG (Deepest Blue-Black)
          secondary: "#151A25", // Sidebar / Sections
          tertiary: "#1E2536", // Inputs / Borders
        },
        surface: {
          DEFAULT: "#1C212E", // Cards / Panels
          hover: "#252B3B", // Hover states
          active: "#2D3445", // Active states
        },
        primary: {
          DEFAULT: "#F59E0B", // Gold (Main Action)
          hover: "#D97706",
          light: "#FCD34D", // Highlights
        },
        accent: {
          violet: {
            DEFAULT: "#8B5CF6", // Crypto Vibe Purple
            glow: "#A78BFA",
          },
          cyan: {
            DEFAULT: "#06B6D4", // Tech/Info Cyan
            glow: "#22D3EE",
          },
          rose: "#F43F5E", // Hot / Live Actions
        },
        text: {
          primary: "#FFFFFF", // Headings (Pure White)
          secondary: "#9CA3AF", // Body (Cool Gray)
          tertiary: "#6B7280", // Muted / Meta
          disabled: "#4B5563",
        },
        status: {
          success: "#10B981", // Wins / Profits
          error: "#EF4444",   // Errors / Losses
          warning: "#F59E0B", // Alerts
          info: "#3B82F6",    // Notifications
        },
      },
      // 2. FONTS: Modern Crypto Typography
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"], // UI text, readable
        display: ["var(--font-rajdhani)", "sans-serif"], // Headings, Numbers, Data
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.75rem" }], // 10px
        xs: ["0.75rem", { lineHeight: "1rem" }],        // 12px
        sm: ["0.875rem", { lineHeight: "1.25rem" }],   // 14px
        base: ["1rem", { lineHeight: "1.5rem" }],      // 16px
        lg: ["1.125rem", { lineHeight: "1.75rem" }],   // 18px
        xl: ["1.25rem", { lineHeight: "1.75rem" }],    // 20px
        "2xl": ["1.5rem", { lineHeight: "2rem" }],      // 24px
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],// 30px
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],  // 36px
        "5xl": ["3rem", { lineHeight: "1" }],           // 48px
        "6xl": ["3.75rem", { lineHeight: "1" }],        // 60px
      },
      // 3. GRADIENTS: High-energy visuals
      backgroundImage: {
        "gradient-gold": "linear-gradient(135deg, #F59E0B 0%, #B45309 100%)", // Primary Buttons
        "gradient-violet": "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)", // VIP / Special
        "gradient-dark": "linear-gradient(180deg, rgba(11,14,20,0) 0%, #0B0E14 100%)", // Fade overlays
        "gradient-glass": "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)", // Cards
      },
      // 4. SHADOWS: Neon Glows
      boxShadow: {
        "glow-gold": "0 0 20px rgba(245, 158, 11, 0.4)", // Primary Actions
        "glow-violet": "0 0 20px rgba(139, 92, 246, 0.4)", // Secondary Actions
        "glow-cyan": "0 0 15px rgba(6, 182, 212, 0.4)", // Tech elements
        "card": "0 8px 32px rgba(0, 0, 0, 0.4)", // Deep shadow for depth
        "inner-light": "inset 0 1px 0 rgba(255, 255, 255, 0.1)", // Top highlight
      },
      // 5. BORDER RADIUS: Smooth Modern Curves
      borderRadius: {
        lg: "0.75rem",    // 12px (Cards)
        xl: "1rem",       // 16px (Large Cards)
        "2xl": "1.5rem",  // 24px (Modals)
        full: "9999px",   // Buttons / Avatars
      },
      // 6. ANIMATIONS
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
