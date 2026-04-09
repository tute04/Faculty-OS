/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: 'rgb(var(--bg-base) / <alpha-value>)',
        surface: 'rgb(var(--bg-surface) / <alpha-value>)',
        elevated: 'rgb(var(--bg-elevated) / <alpha-value>)',
        hover: 'rgba(var(--bg-hover) / 0.04)',
        sidebar: 'rgb(var(--bg-sidebar) / <alpha-value>)',
        border: {
          DEFAULT: 'rgba(var(--border) / 0.08)',
          accent: 'rgba(var(--border-accent) / 0.12)',
        },
        text: {
          primary: 'rgb(var(--text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
          faint: 'rgb(var(--text-faint) / <alpha-value>)',
        },
        amber: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          soft: 'rgb(var(--accent-soft) / <alpha-value>)',
        },
        orange: 'rgb(var(--accent-orange) / <alpha-value>)',
        green: 'rgb(var(--success) / <alpha-value>)',
        red: 'rgb(var(--danger) / <alpha-value>)',
        yellow: 'rgb(var(--warning) / <alpha-value>)',
        backgroundImage: {
          'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        },
        keyframes: {
          shimmer: {
            '100%': { transform: 'translateX(100%)' }
          }
        },
        cat: {
          facultad: 'var(--accent)',
          estudio: 'var(--accent-orange)',
          futbol: 'var(--success)',
          emprendimiento: 'var(--accent-soft)',
          libre: 'var(--text-muted)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
        chip: '6px',
      },
      fontSize: {
        label: ['11px', { letterSpacing: '0.7px', fontWeight: '500' }],
      },
    },
  },
  plugins: [],
};
