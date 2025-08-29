/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Use CSS custom properties for dynamic theming
        background: 'var(--color-background)',
        'secondary-background': 'var(--color-secondary-background)',
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        text: 'var(--color-text)',
        border: 'var(--color-border)',
      },
    },
  },
  plugins: [],
}

