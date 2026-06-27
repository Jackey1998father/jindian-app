/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // 锦点品牌色
        persimmon: {
          DEFAULT: "#E0551F",
          hi: "#F06830",
          light: "#FDF1E8",
        },
        wasabi: {
          DEFAULT: "#4A6B40",
          light: "#E0EBDA",
        },
        sprout: {
          DEFAULT: "#89A87E",
          dim: "#A8C49E",
        },
        "rice-broth": "#FDF9F5",
        parchment: "#F8F3EC",
        ink: {
          DEFAULT: "#2D2720",
          soft: "#5C5248",
          muted: "#8C8175",
          faint: "#B8AFA6",
        },
        thread: {
          DEFAULT: "#EBE3D8",
          light: "#F3EDE6",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        display: ['"Noto Serif SC"', '"STSong"', '"SimSun"', '"Songti SC"', 'serif'],
        body: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
      },
      keyframes: {
        "msg-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "rag-pulse": {
          "0%": { boxShadow: "0 0 0 0 rgba(137,168,126,0.35)" },
          "50%": { boxShadow: "0 0 0 8px rgba(74,107,64,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(137,168,126,0)" },
        },
        "welcome-float": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "33%": { transform: "translateY(-6px) rotate(1deg)" },
          "66%": { transform: "translateY(-2px) rotate(-1deg)" },
        },
        "dot-bounce": {
          "0%, 60%, 100%": { transform: "translateY(0)", opacity: "0.35" },
          "30%": { transform: "translateY(-5px)", opacity: "1" },
        },
        "toast-in": {
          from: { opacity: "0", transform: "translateX(40px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "sheet-in": {
          from: { opacity: "0", transform: "translateY(12px) scale(0.97)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "msg-in": "msg-in 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "rag-pulse": "rag-pulse 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
        "welcome-float": "welcome-float 4s ease-in-out infinite",
        "dot-bounce": "dot-bounce 1.3s ease-in-out infinite",
        "toast-in": "toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "sheet-in": "sheet-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
