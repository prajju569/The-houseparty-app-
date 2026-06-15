/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Page & surface
        canvas:  '#F5F4F0',
        surface: '#FFFFFF',
        // Ink scale (warm, never pure #000)
        ink:          '#0A0A0A',
        'ink-sub':    '#6B6B65',
        'ink-muted':  '#9E9E96',
        // Champagne gold accent – the party world distilled
        gold:         '#C8A951',
        'gold-tint':  '#F7EED6',
        // Positive / available
        party:        '#1A7A4A',
        'party-tint': '#E6F4ED',
        // Structural
        border:       '#E8E7E3',
        'border-mid': '#C9C8C3',
      },
    },
  },
  plugins: [],
};
