/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Lifted directly from the generated chart SVGs so the page and the
        // plotted ink are one palette.
        void: '#08080a',
        pitch: '#0d0d10',
        ink: '#141414',
        bone: '#f4f2ec',
        sand: '#b9b6ac',
        volt: '#1f2cd1',
        lift: '#8189ff',
        rust: '#c9552b',
      },
      fontFamily: {
        sans: ['Geist Variable', 'Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.055em',
        editorial: '-0.03em',
      },
      maxWidth: {
        canvas: '112rem',
      },
    },
  },
  plugins: [],
}
