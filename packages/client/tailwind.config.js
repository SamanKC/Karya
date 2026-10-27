/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand — deep pine, original to Karya (not a red task-app accent)
        brand: {
          50: '#eef6f2',
          100: '#d6ebe0',
          200: '#aed6c1',
          300: '#7ebc9e',
          400: '#49987a',
          500: '#1f6f54',  // primary
          600: '#195b45',
          700: '#144836',
          800: '#10392a',
          900: '#0c2c21',
        },
        // Sidebar and surface colors — warm paper, not cold grey
        sidebar: {
          bg: '#f6f4ee',
          hover: '#ece8de',
          active: '#dfe9e2',
          text: '#2a2e29',
          muted: '#837d6e',
        },
        surface: {
          primary: '#fffefb',
          secondary: '#f6f4ee',
          border: '#e2ddd0',
          hover: '#ece8de',
        },
        // Priority colors (ADR-002) — clay / gold / pine, distinct hues
        priority: {
          urgent: '#c2542f',
          high: '#c98a2c',
          medium: '#1f6f54',
        },
        // Semantic
        success: '#1f6f54',
        warning: '#c98a2c',
        danger: '#b5432a',
        info: '#3d6ea5',
        ink: '#1b2420',
        paper: '#f6f4ee',
      },
      fontFamily: {
        sans: [
          '"IBM Plex Sans"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
        display: [
          '"Fraunces"',
          'ui-serif',
          'Georgia',
          'serif',
        ],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],   // 11px
      },
      spacing: {
        sidebar: '280px',
        'sidebar-collapsed': '0px',
      },
      maxWidth: {
        content: '800px',
      },
      transitionDuration: {
        sidebar: '200ms',
      },
      animation: {
        'fade-in': 'fadeIn 150ms ease-in',
        'slide-in': 'slideIn 200ms ease-out',
        'slide-out': 'slideOut 200ms ease-in',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOut: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
    },
  },
  plugins: [],
};
