/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.tsx",
        "./src/**/*.{js,jsx,ts,tsx}",
        "./core/**/*.{js,jsx,ts,tsx}",
        "./api/**/*.{js,jsx,ts,tsx}"
    ],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#1349ec',
                    dark: '#0e36b5',
                    foreground: '#ffffff',
                },
                background: {
                    light: '#f6f6f8',
                    dark: '#101522',
                },
                surface: {
                    light: '#ffffff',
                    dark: '#1e2330',
                }
            },
            fontFamily: {
                display: ['Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
            }
        },
    },
    plugins: [],
}
