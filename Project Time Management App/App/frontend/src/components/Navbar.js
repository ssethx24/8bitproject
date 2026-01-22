import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

/**
 * @file Navbar.js
 * @description This component renders a responsive navigation bar for the web application. 
 * It includes links to various sections such as Home, Product Backlog, and Sprints, 
 * and conditionally displays an "Admin View" link for users with the 'scrum-master' role. 
 * The component also manages user authentication state, handles the logout process, 
 * and adjusts the layout for mobile screens.
 * 
 * @component
 * @param {function} setIsAuthenticated - Function to update the global authentication state.
 * @param {function} setUserRole - Function to update the user's role in the global state.
 * 
 * @example
 * <Navbar setIsAuthenticated={setIsAuthenticated} setUserRole={setUserRole} />
 * 
 * @dependencies
 * - react: Core library for building the component.
 * - react-router-dom: Provides navigation (`Link`) and redirect functionality (`useNavigate`).
 * - Button: Custom button component used for the "Logout" button.
 * - Navbar.css: CSS for styling the navigation bar.
 * 
 * @notes
 * - The component is responsive and shows/hides the menu based on screen width.
 * - Retrieves the user's role from localStorage to determine if the "Admin View" link should be shown.
 * - Includes a confirmation prompt on logout.
 */

function Navbar({ setIsAuthenticated, setUserRole }) {
  // State to manage the menu icon click for mobile view
  const [click, setClick] = useState(false);
  
  // State to manage visibility of the button based on screen size
  const [button, setButton] = useState(true);
  
  // Local state to store the user's role from localStorage
  const [userRole, setUserRoleLocal] = useState(''); 
  
  const navigate = useNavigate(); // Hook for navigation

  // Toggle the mobile menu on icon click
  const handleClick = () => setClick(!click);
  
  // Close the mobile menu when a link is clicked
  const closeMobileMenu = () => setClick(false);

  // Determine whether to show/hide the button based on window width
  const showButton = () => {
    if (window.innerWidth <= 960) {
      setButton(false); // Hide button if the screen is narrow
    } else {
      setButton(true); // Show button if the screen is wide
    }
  };

  // Effect to handle window resizing and set user role from localStorage
  useEffect(() => {
    showButton(); // Initial button visibility check
    window.addEventListener('resize', showButton); // Add resize event listener
    
    // Retrieve the user role from localStorage
    const role = localStorage.getItem('role');
    setUserRoleLocal(role); // Set local state with user role

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('resize', showButton);
    };
  }, []);

  // Handle logout process with confirmation prompt
  const handleLogout = () => {
    const confirmLogout = window.confirm('Are you sure you want to log out?');
    if (confirmLogout) {
      // Clear authentication and role info from localStorage
      localStorage.removeItem('authenticated');
      setIsAuthenticated(false); // Update global authentication status
      localStorage.removeItem('role');
      setUserRole(''); // Clear global role status

      // Redirect to login page after logout
      navigate('/login'); 
    }
  };

  return (
    <>
      <nav className='navbar'>
        <div className='navbar-container'>
          {/* Logo that redirects to the home page */}
          <Link to='/' className='navbar-logo' onClick={closeMobileMenu}>
            8BIT
            <i className='fab fa-typo3' /> {/* Icon for logo */}
          </Link>

          {/* Menu icon for mobile view */}
          <div className='menu-icon' onClick={handleClick}>
            {/* Switch between hamburger and close icon based on state */}
            <i className={click ? 'fas fa-times' : 'fas fa-bars'} />
          </div>

          {/* Navigation links, active class if menu is open */}
          <ul className={click ? 'nav-menu active' : 'nav-menu'}>
            <li className='nav-item'>
              <Link to='/' className='nav-links' onClick={closeMobileMenu}>
                Home
              </Link>
            </li>
            <li className='nav-item'>
              <Link
                to='/productbacklog'
                className='nav-links'
                onClick={closeMobileMenu}
              >
                Product Backlog
              </Link>
            </li>
            <li className='nav-item'>
              <Link
                to='/sprint1'
                className='nav-links'
                onClick={closeMobileMenu}
              >
                Sprint 1
              </Link>
            </li>
            <li className='nav-item'>
              <Link
                to='/sprint2'
                className='nav-links'
                onClick={closeMobileMenu}
              >
                Sprint 2
              </Link>
            </li>
            <li className='nav-item'>
              <Link
                to='/sprint3'
                className='nav-links'
                onClick={closeMobileMenu}
              >
                Sprint 3
              </Link>
            </li>
            <li className='nav-item'>
              <Link
                to='/charts'
                className='nav-links'
                onClick={closeMobileMenu}
              >
                Charts
              </Link>
            </li>

            {/* Admin View link only visible to Scrum Masters */}
            {userRole === 'scrum-master' && (
              <li className="nav-item">
                <Link to="/adminview" className="nav-links" onClick={closeMobileMenu}>
                  Admin View
                </Link>
              </li>
            )}

          </ul>

          {/* Show Logout button if the user is authenticated */}
          <Button buttonStyle='btn--outline' onClick={handleLogout}>
            LOGOUT
          </Button>
        </div>
      </nav>
    </>
  );
}

export default Navbar;
