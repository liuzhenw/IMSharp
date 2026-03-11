/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#ec5b13',
        danger: '#ef4444',
        online: '#10b981',
        offline: '#6b7280',
        background: {
          light: '#f5f7f8',
          dark: '#0f1923',
        },
      },
      fontFamily: {
        sans: ['Public Sans', 'Noto Sans SC', 'sans-serif'],
      },
      fontSize: {
        badge: '10px',
      },
      boxShadow: {
        'primary-20': '0 4px 6px -1px rgb(236 91 19 / 0.2)',
        'primary-25': '0 10px 15px -3px rgb(236 91 19 / 0.25)',
      },
      zIndex: {
        dropdown: '10',
        sticky: '20',
        'modal-backdrop': '40',
        modal: '50',
        toast: '60',
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-in-out',
        'zoom-in': 'zoom-in 200ms ease-in-out',
        'slide-in-from-bottom': 'slide-in-from-bottom 200ms ease-in-out',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'zoom-in': {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        'slide-in-from-bottom': {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
}
