/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#003d9b',
        'primary-container': '#0052cc',
        secondary: '#5b5f62',
        tertiary: '#004962',
        error: '#ba1a1a',
        background: '#f9f9ff',
        surface: '#f9f9ff',
        'on-surface': '#101c2d',
        'on-background': '#101c2d',
        outline: '#737685',
        'outline-variant': '#c3c6d6',
        'on-primary': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#410002',
        'surface-container': '#e8e8f0',
        'surface-container-low': '#f2f2fa',
        'on-surface-variant': '#44474f',
      },
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Manrope"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
