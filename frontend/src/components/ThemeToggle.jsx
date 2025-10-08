import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-9 w-16 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      <div
        className={`absolute left-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-lg transition-transform duration-200 ${
          isDarkMode ? 'translate-x-7' : 'translate-x-0'
        }`}
      >
        {isDarkMode ? (
          <Moon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        ) : (
          <Sun className="h-4 w-4 text-yellow-500" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;