import defaultTheme from 'tailwindcss/defaultTheme'
import forms from '@tailwindcss/forms'

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans:  ['IBM Plex Sans', ...defaultTheme.fontFamily.sans],
                serif: ['IBM Plex Serif', ...defaultTheme.fontFamily.serif],
                mono:  ['IBM Plex Mono', ...defaultTheme.fontFamily.mono],
            },
            colors: {
                // Design system — mirrors the existing Vite frontend
                teal: {
                    50:  '#def2f1',
                    100: '#b2d8d8',
                    200: '#8ec8c7',
                    400: '#5a9090',
                    500: '#3aafa9',
                    600: '#2b9e99',
                    700: '#2b6e6b',
                    900: '#0d2b2b',
                },
                brand: {
                    red:    '#d93050',
                    orange: '#e06030',
                    gold:   '#d4a017',
                    green:  '#3aaf6b',
                },
            },
        },
    },
    plugins: [forms],
}
