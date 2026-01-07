/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable dark mode with class strategy
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  safelist: [
    // Purple theme colors
    'bg-purple-50',
    'bg-violet-50',
    'from-purple-50',
    'via-white',
    'to-violet-50',
    'border-purple-100',
    'border-purple-200',
    'hover:bg-purple-50',
    'text-[#6C5CE7]',
    'text-[#8E44AD]',
    'bg-[#A29BFE]/10',
    'bg-[#A29BFE]/15',
    'bg-[#A29BFE]/20',
    'bg-[#A29BFE]/30',
    'from-[#6C5CE7]',
    'to-[#00CEC9]',
    'from-[#8E44AD]',
    'from-[#A29BFE]/30',
    'to-[#00CEC9]/20',
    'border-[#6C5CE7]/30',
    'hover:border-[#6C5CE7]',
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
        },
        violet: {
          50: '#f5f3ff',
        }
      },
    },
  },
  plugins: [],
}
