/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand
        brand: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#dc4c3e',  // primary (Karya red, inspired by task management apps)
          600: '#c53727',
          700: '#a52e1f',
          800: '#862a1f',
          900: '#6f2720',
        },
        // Sidebar and surface colors
        sidebar: {
          bg: '#fafafa',
          hover: '#f0f0f0',
          active: '#ffe8e4',
          text: '#333333',
          muted: '#808080',
        },
        surface: {
          primary: '#ffffff',
          secondary: '#fafafa',
          border: '#e5e5e5',
          hover: '#f5f5f5',
        },
        // Priority colors (ADR-002)
        priority: {
          urgent: '#d1453b',
          high: '#eb8909',
          medium: '#246fe0',
        },
        // Semantic
        success: '#058527',
        warning: '#eb8909',
        danger: '#d1453b',
        info: '#246fe0',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
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
