import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{html,js}'],
  theme: {
    extend: {
      colors: {
        cream: '#FFF9F5',
        blush: '#FFD6E8',
        rose: '#FF9EC4',
        sky: '#B7E2FF',
        periw: '#A8B4FF',
        taupe: '#574C43',
        gold: '#F7E1B2',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        display: ['"Cormorant Garamond"', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        script: ['"Great Vibes"', 'cursive'],
      },
      boxShadow: {
        glow: '0 0 40px 0 rgba(168,180,255,0.35)',
        soft: '0 10px 40px rgba(0,0,0,0.05)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(120deg,#FFD6E8 0%,#FF9EC4 28%,#A8B4FF 68%,#B7E2FF 100%)',
      },
      borderRadius: {
        pill: '9999px',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        shimmer: 'shimmer 8s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [forms, typography],
};
