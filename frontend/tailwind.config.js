/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          green: '#00ffa3',
          yellow: '#ffd84d',
          red: '#ff2757'
        }
      },
      keyframes: {
        aurora: {
          '0%': { transform: 'rotate(0deg) scale(1.2)' },
          '100%': { transform: 'rotate(360deg) scale(1.2)' }
        },
        pulseGlow: {
          '0%, 100%': { transform: 'scale(1)', filter: 'drop-shadow(0 0 0 rgba(255,39,87,0.5))' },
          '50%': { transform: 'scale(1.01)', filter: 'drop-shadow(0 0 18px rgba(255,39,87,0.7))' }
        }
      },
      animation: {
        aurora: 'aurora 18s linear infinite',
        pulseGlow: 'pulseGlow 1.6s ease-in-out infinite'
      }
    }
  },
  plugins: []
}
