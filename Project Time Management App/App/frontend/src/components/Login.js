import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Importing Axios for making HTTP requests
import './Login.css'; // Importing CSS for styling the login page

/**
 * @file Login.js
 * @description This file contains the `Login` component, which handles the user login functionality.
 * The component allows users to input their credentials (username and password), sends the credentials
 * to the backend via an HTTP POST request using Axios, and handles authentication. If the login is
 * successful, the user's authentication status and role are stored in local storage, and they are
 * redirected to the home page or dashboard.
 * 
 * @author Shaurya Seth
 * @version 1.0
 * @date 2024-10-15
 */
function Login({ setIsAuthenticated, setUserRole }) {
  // State to handle input fields and error messages
  const [username, setUsername] = useState(''); // Username (email) input state
  const [password, setPassword] = useState(''); // Password input state
  const [errorMessage, setErrorMessage] = useState(''); // Error message state for failed login attempts
  const navigate = useNavigate(); // Hook for redirecting to another page

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent page reload on form submission

    try {
      // Send the login request to the backend using Axios
      const response = await axios.post('/api/login', {
        email: username,   // Send the username (email) as 'email' to the backend
        password: password // Send the password
      });

      // Handle the response from the backend
      if (response.status === 200) {
        const { role } = response.data; // Extract user role from response
        // Store authentication and role information in local storage
        localStorage.setItem('authenticated', 'true');
        localStorage.setItem('role', role);
        setIsAuthenticated(true); // Update authentication state
        setUserRole(role); // Set user role state

        // Redirect to home page or dashboard based on the authentication
        navigate('/');
      }
    } catch (error) {
      // If there's an error (e.g., invalid credentials), display an error message
      setErrorMessage('Invalid credentials, please try again.');
    }
  };

  return (
    <div className="login-container">
      {/* Add a logo to the login page */}
      <img
        src={`${process.env.PUBLIC_URL}/8bit.jpg`}
        alt="Logo"
        className="login-logo"
      />

      {/* Login form */}
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        {/* Username (email) input */}
        <label>
          Username:
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)} // Update username state on input change
            placeholder="Enter your email" // Placeholder text
          />
        </label>
        <br />

        {/* Password input */}
        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)} // Update password state on input change
            placeholder="Enter your password" // Placeholder text
          />
        </label>
        <br />

        {/* Submit button */}
        <button type="submit">Login</button>
      </form>

      {/* Display error message if login fails */}
      {errorMessage && <p className="error-message">{errorMessage}</p>}
    </div>
  );
}

export default Login;
