import React from 'react';
import './Button.css';
import { Link } from 'react-router-dom';

// Available styles and sizes for the button
const STYLES = ['btn--primary', 'btn--outline', 'btn--test'];
const SIZES = ['btn--medium', 'btn--large'];

export const Button = ({
  children,     // Content inside the button (e.g., text, icon)
  type,         // Button type (e.g., 'submit', 'button')
  onClick,      // Function to handle button clicks
  buttonStyle,  // Custom style passed to the button
  buttonSize    // Custom size passed to the button
}) => {
  // Check if the provided buttonStyle is valid; fallback to 'btn--primary' if not
  const checkButtonStyle = STYLES.includes(buttonStyle)
    ? buttonStyle
    : STYLES[0];

  // Check if the provided buttonSize is valid; fallback to 'btn--medium' if not
  const checkButtonSize = SIZES.includes(buttonSize) ? buttonSize : SIZES[0];

  return (
    // Wrap the button in a Link to navigate to the homepage ('/')
    <Link to='/' className='btn-mobile'>
      <button
        className={`btn ${checkButtonStyle} ${checkButtonSize}`} // Apply dynamic styles and sizes
        onClick={onClick}  // Attach the onClick event handler
        type={type}        // Specify the button type (e.g., submit, button)
      >
        {children}         
      </button>
    </Link>
  );
};
