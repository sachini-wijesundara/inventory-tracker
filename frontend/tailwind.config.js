/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        ink: {
          DEFAULT: '#0A0A0F',
          soft: '#16161E',
          muted: '#1E1E2A',
        },
        ash: {
          DEFAULT: '#8B8BA0',
          light: '#B8B8CC',
          dim: '#4A4A60',
        },
        paper: {
          DEFAULT: '#F4F3F0',
          warm: '#EBE9E4',
        },
        accent: {
          DEFAULT: '#C8F542',
          dim: '#A8CC30',
          soft: '#E8FF8A',
        },
        danger: '#FF5C5C',
        warn: '#FFB84D',
        success: '#4DCFA0',
      },
      borderRadius: {
        DEFAULT: '6px',
        lg: '10px',
        xl: '16px',
      },
    },
  },
  plugins: [],
}
