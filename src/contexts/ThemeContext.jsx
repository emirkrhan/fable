'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  // Initialize with default, will be synced from localStorage in useEffect
  const [theme, setThemeState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('story-planner-theme') || 'dark';
    }
    return 'dark';
  });

  // Sync theme state with localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('story-planner-theme') || 'dark';
    setThemeState(savedTheme);
  }, []);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('story-planner-theme', newTheme);

    // HTML'e class ekle/çıkar
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
