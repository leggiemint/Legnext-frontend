module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./styles/globals.css",
  ],
  theme: {
    extend: {
      fontFamily: {
        // 现代系统字体栈 - 性能最佳，无需外部加载
        'sans': [
          // macOS 和 iOS
          '-apple-system',
          'BlinkMacSystemFont',
          // Windows
          'Segoe UI',
          // Android 和 Chrome OS
          'Roboto',
          // Ubuntu
          'Ubuntu',
          // 通用 Linux
          'Cantarell',
          // Firefox OS
          'Fira Sans',
          // Android
          'Droid Sans',
          // 后备字体
          'Helvetica Neue',
          'Arial',
          'sans-serif',
          // 支持 emoji
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
          'Noto Color Emoji'
        ],
      },
      backgroundImage: {
        gradient:
          "linear-gradient(60deg, #f79533, #f37055, #ef4e7b, #a166ab, #5073b8, #1098ad, #07b39b, #6fba82)",
      },
      animation: {
        opacity: "opacity 0.25s ease-in-out",
        appearFromRight: "appearFromRight 300ms ease-in-out",
        wiggle: "wiggle 1.5s ease-in-out infinite",
        popup: "popup 0.25s ease-in-out",
        shimmer: "shimmer 3s ease-out infinite alternate",
        'scroll-left': 'scroll-left 30s linear infinite',
        'scroll-right': 'scroll-right 30s linear infinite',
      },
      keyframes: {
        opacity: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        appearFromRight: {
          "0%": { opacity: 0.3, transform: "translate(15%, 0px);" },
          "100%": { opacity: 1, transform: "translate(0);" },
        },
        wiggle: {
          "0%, 20%, 80%, 100%": {
            transform: "rotate(0deg)",
          },
          "30%, 60%": {
            transform: "rotate(-2deg)",
          },
          "40%, 70%": {
            transform: "rotate(2deg)",
          },
          "45%": {
            transform: "rotate(-4deg)",
          },
          "55%": {
            transform: "rotate(4deg)",
          },
        },
        popup: {
          "0%": { transform: "scale(0.8)", opacity: 0.8 },
          "50%": { transform: "scale(1.1)", opacity: 1 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
        shimmer: {
          "0%": { backgroundPosition: "0 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        'scroll-left': {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        'scroll-right': {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    // Light & dark themes are added by default (it switches automatically based on OS settings)
    // You can add another theme among the list of 30+
    // Add "data-theme='theme_name" to any HTML tag to enable the 'theme_name' theme.
    // https://daisyui.com/
    themes: [
      "light", 
      "dark",
      {
        legnext: {
          "primary": "#4f46e5",
          "primary-focus": "#4338ca",
          "primary-content": "#ffffff",
          "secondary": "#6366f1",
          "secondary-focus": "#4f46e5",
          "secondary-content": "#ffffff",
          "accent": "#6366f1",
          "accent-focus": "#4f46e5",
          "accent-content": "#ffffff",
          "neutral": "#3d4451",
          "neutral-focus": "#2a323c",
          "neutral-content": "#ffffff",
          "base-100": "#ffffff",
          "base-200": "#f1f5f9",
          "base-300": "#e2e8f0",
          "base-content": "#1e293b",
          "info": "#4f46e5",
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#ef4444",
        },
      }
    ],
  },
};
