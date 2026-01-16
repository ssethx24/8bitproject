// Header.js
import React, { useContext } from 'react';
import { ThemeContext } from '../contexts/theme-context'; // Importing theme context to handle theme changes
import './Header.css'; // Importing CSS for styling the header
import TranslateComponent from './TranslationComponent'; // Component for handling translations, adjust path if necessary

const Header = () => {
  // Use theme and toggleTheme from ThemeContext to manage current theme and switching logic
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <header className={`header theme-${theme}`}>
      {/* Display the header title */}
      <h1>Theme Switcher</h1>
      
      {/* Button to toggle between themes */}
      <button onClick={toggleTheme}>
        Switch to{' '}
        {theme === 'dark'
          ? 'Light'           // If the theme is dark, offer to switch to Light Mode
          : theme === 'light'
          ? 'High Contrast'    // If the theme is light, offer to switch to High Contrast Mode
          : 'Dark'}{' '}        
        Mode
      </button>

      {/* Translation component for handling language changes */}
      <TranslateComponent />
    </header>
  );
};

export default Header;
