/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8B6914',
          light: '#B8941C',
          dark: '#6B4F10',
        },
        cream: {
          50: '#FFFCF7',
          100: '#FFF8F0',
          200: '#FEF3E2',
          300: '#F3EDE4',
          400: '#E5DDD0',
          500: '#D4C9B8',
        },
        surface: '#FFFFFF',
        card: '#FFFCF7',
        txt: {
          DEFAULT: '#1A1A2E',
          secondary: '#6B7280',
          muted: '#9CA3AF',
        },
        border: '#E5DDD0',
        success: '#059669',
        warning: '#D97706',
        error: '#DC2626',
        info: '#2563EB',
        categ: {
          comun: '#6B7280',
          especial: '#2563EB',
          plata: '#94A3B8',
          oro: '#D97706',
          platino: '#7C3AED',
        },
      },
    },
  },
  plugins: [],
};
