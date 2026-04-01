/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        hover: 'var(--bg-hover)',
        sidebar: 'var(--bg-sidebar)',
        border: {
          DEFAULT: 'var(--border)',
          accent: 'var(--border-accent)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          faint: 'var(--text-faint)',
        },
        amber: {
          DEFAULT: 'var(--accent)',
          soft: 'var(--accent-soft)',
        },
        orange: 'var(--accent-orange)',
        green: 'var(--success)',
        red: 'var(--danger)',
        yellow: 'var(--warning)',
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
