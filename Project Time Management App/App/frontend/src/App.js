// src/App.js

import './App.css';
import Navbar from './components/Navbar';
import {
  HashRouter as Router,
  Route,
  Routes,
  Navigate
} from 'react-router-dom';

import Home from './components/pages/Home';
import ProductBacklog from './components/pages/ProductBacklog';
import ProductBacklogTeamView from './components/pages/ProductBacklogTeamView';
import Sprint1 from './components/pages/Sprint1';
import Sprint2 from './components/pages/Sprint2';
import Sprint3 from './components/pages/Sprint3';
import Sprint1TeamView from './components/pages/Sprint1TeamView';
import Sprint2TeamView from './components/pages/Sprint2TeamView';
import Sprint3TeamView from './components/pages/Sprint3TeamView';
import Charts from './components/pages/Charts';
import Login from './components/Login';
import AdminView from './components/pages/AdminView';

import { useEffect, useState } from 'react';
import { ThemeProvider } from './contexts/theme-context';
import Header from './components/Header';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setUserRole] = useState('');

  useEffect(() => {
    const authStatus = localStorage.getItem('authenticated');
    setIsAuthenticated(authStatus === 'true');

    const userRole = localStorage.getItem('role');
    setUserRole(userRole || '');
  }, []);

  return (
    <ThemeProvider>
      <Router>
        {isAuthenticated && (
          <Navbar
            setIsAuthenticated={setIsAuthenticated}
            setUserRole={setUserRole}
          />
        )}

        <Header />

        <Routes>
          {/* LOGIN */}
          <Route
            path="/login"
            element={
              <Login
                setIsAuthenticated={setIsAuthenticated}
                setUserRole={setUserRole}
              />
            }
          />

          {/* HOME */}
          <Route
            path="/"
            element={isAuthenticated ? <Home /> : <Navigate to="/login" />}
          />

          {/* PRODUCT BACKLOG */}
          <Route
            path="/productbacklog"
            element={
              isAuthenticated ? (
                role === 'team-member' ? (
                  <ProductBacklogTeamView />
                ) : role === 'scrum-master' ? (
                  <ProductBacklog />
                ) : (
                  <Navigate to="/login" />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* SPRINT 1 */}
          <Route
            path="/sprint1"
            element={
              isAuthenticated ? (
                role === 'team-member' ? (
                  <Sprint1TeamView />
                ) : role === 'scrum-master' ? (
                  <Sprint1 />
                ) : (
                  <Navigate to="/login" />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* SPRINT 2 */}
          <Route
            path="/sprint2"
            element={
              isAuthenticated ? (
                role === 'team-member' ? (
                  <Sprint2TeamView />
                ) : role === 'scrum-master' ? (
                  <Sprint2 />
                ) : (
                  <Navigate to="/login" />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* SPRINT 3 */}
          <Route
            path="/sprint3"
            element={
              isAuthenticated ? (
                role === 'team-member' ? (
                  <Sprint3TeamView />
                ) : role === 'scrum-master' ? (
                  <Sprint3 />
                ) : (
                  <Navigate to="/login" />
                )
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* CHARTS */}
          <Route
            path="/charts"
            element={isAuthenticated ? <Charts /> : <Navigate to="/login" />}
          />

          {/* ADMIN VIEW */}
          <Route
            path="/adminview"
            element={
              isAuthenticated && role === 'scrum-master' ? (
                <AdminView />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
