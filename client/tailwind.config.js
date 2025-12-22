/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Dark Theme Base
                primary: '#000000', // pure black
                secondary: '#18181b', // zinc-900 (cards)

                // Gold Accents
                gold: {
                    light: '#FCD34D', // amber-300
                    DEFAULT: '#F59E0B', // amber-500
                    dark: '#B45309', // amber-700
                    metallic: '#D4AF37', // Custom metallic gold
                },

                // Soft Beige/Text
                beige: {
                    light: '#F5F5F0',
                    DEFAULT: '#E5E5DA',
                    dark: '#CFCFB8',
                }
            },
            fontFamily: {
                serif: ['"Playfair Display"', 'serif'],
                display: ['"Cinzel"', 'serif'],
                sans: ['"Lato"', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'fade-in-up': 'fadeInUp 0.7s ease-out forwards',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        },
    },
    plugins: [],
}
