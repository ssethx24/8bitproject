import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const isBrowserDefaultDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

  const getDefaultTheme = () => {
    const localStorageTheme = localStorage.getItem('theme');
    return localStorageTheme || (isBrowserDefaultDark() ? 'dark' : 'light');
  };

  const [theme, setTheme] = useState(getDefaultTheme());

  useEffect(() => {
    document.body.classList.remove('light-mode', 'dark-mode', 'high-contrast-mode');
    document.body.classList.add(`${theme}-mode`);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'high-contrast' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
