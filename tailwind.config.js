/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        base:     '#090909',
        accent:   '#E8E3D8',
        onAccent: '#0A0A0B',
        glass: {
          primary:   'rgba(255,255,255,0.08)',
          secondary: 'rgba(255,255,255,0.04)',
          border:    'rgba(255,255,255,0.10)',
        },
      },
    },
  },
  plugins: [],
};
