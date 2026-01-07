import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className={`
        relative w-14 h-14 rounded-full flex items-center justify-center
        transition-all duration-300 ease-in-out
        ${theme === 'dark' 
          ? 'bg-gradient-to-br from-indigo-600 to-purple-700 shadow-lg shadow-purple-500/30' 
          : 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-orange-400/30'
        }
        hover:scale-110 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-offset-2 
        ${theme === 'dark' ? 'focus:ring-purple-500' : 'focus:ring-orange-400'}
      `}
      title={theme === 'dark' ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
      aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Sun Icon */}
        <FaSun 
          className={`
            absolute text-2xl text-white transition-all duration-500
            ${theme === 'dark' 
              ? 'opacity-0 rotate-180 scale-0' 
              : 'opacity-100 rotate-0 scale-100'
            }
          `}
        />
        
        {/* Moon Icon */}
        <FaMoon 
          className={`
            absolute text-2xl text-white transition-all duration-500
            ${theme === 'dark' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 -rotate-180 scale-0'
            }
          `}
        />
      </div>
    </button>
  );
};

export default ThemeToggle;
