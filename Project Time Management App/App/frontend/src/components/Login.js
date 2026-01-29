import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { api } from "../api";

/**
 * @file Login.js
 * @description Login component
 */
function Login({ setIsAuthenticated, setUserRole }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage(""); // clear old error

    try {
      const response = await api.post("/api/login", {
        email: username.trim(),
        password: password,
      });

      // ✅ Node backend returns: { token, user: { email, role } }
      const { token, user } = response.data;

      // ✅ Save JWT token (this is the real authentication)
      localStorage.setItem("token", token);

      // Optional: keep your existing flags for UI logic
      localStorage.setItem("authenticated", "true");
      localStorage.setItem("role", user.role);

      setIsAuthenticated(true);
      setUserRole(user.role);

      navigate("/"); // with HashRouter this becomes #/
    } catch (error) {
      const status = error?.response?.status;
      const backendMsg = error?.response?.data?.message;

      if (status === 401) {
        setErrorMessage("Invalid credentials, please try again.");
      } else if (status) {
        setErrorMessage(`Login failed (HTTP ${status}): ${backendMsg || "Server error"}`);
      } else {
        setErrorMessage(`Login failed: ${error?.message || "Network/CORS error"}`);
      }

      console.error("Login error:", error);
    }
  };

  return (
    <div className="login-container">
      <img
        src={`${process.env.PUBLIC_URL}/8bit.jpg`}
        alt="Logo"
        className="login-logo"
      />

      <h2>Login</h2>

      <form onSubmit={handleSubmit}>
        <label>
          Username:
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your email"
          />
        </label>
        <br />

        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
        </label>
        <br />

        <button type="submit">Login</button>
      </form>

      {errorMessage && <p className="error-message">{errorMessage}</p>}
    </div>
  );
}

export default Login;
