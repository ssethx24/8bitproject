import React, { useState, useEffect, useContext } from 'react';
import AccumulationChart1 from './AccumulationChart1';
import AccumulationChart2 from './AccumulationChart2';
import BurndownChart from './BurndownChart'; // Import the BurndownChart component
import './styles.css'; // Import styles
import { ThemeContext } from '../../contexts/theme-context'; // Import ThemeContext for theming

const Charts = () => {
  const { theme } = useContext(ThemeContext); // Access the current theme from context

  // State to store sprints fetched from localStorage
  const [sprints, setSprints] = useState(() => {
    const savedSprints = localStorage.getItem('sprints');
    return savedSprints ? JSON.parse(savedSprints) : [];
  });

  // State to track the selected sprint
  const [selectedSprint, setSelectedSprint] = useState('');

  // State to store the sprint backlog fetched from localStorage
  const [sprintBacklog, setSprintBacklog] = useState(() => {
    const savedSprintBacklog = localStorage.getItem('sprintBacklog');
    return savedSprintBacklog ? JSON.parse(savedSprintBacklog) : [];
  });

  // States to hold estimated and actual hours for selected sprint
  const [estimatedHours, setEstimatedHours] = useState([]);
  const [actualHours, setActualHours] = useState([]);

  // State to manage active tab (Sprint Review or Developer Review)
  const [activeTab, setActiveTab] = useState('sprint-review');

  // Effect to handle updates to sprints from localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const savedSprints = localStorage.getItem('sprints');
      setSprints(savedSprints ? JSON.parse(savedSprints) : []);
    };

    window.addEventListener('storage', handleStorageChange); // Listen to storage changes
    return () => window.removeEventListener('storage', handleStorageChange); // Cleanup on unmount
  }, []);

  // Handle sprint selection from dropdown
  const handleSprintSelection = (e) => {
    const sprintName = e.target.value;
    setSelectedSprint(sprintName);

    if (sprintName) {
      // Filter backlog items for the selected sprint
      const selectedSprintBacklog = sprintBacklog.filter((item) => item.sprint === sprintName);

      // Aggregate estimated and actual hours for the selected sprint
      const totalEstimated = selectedSprintBacklog.reduce((acc, item) => {
        return acc + (item.estimatedTime ? parseTimeToHours(item.estimatedTime) : 0);
      }, 0);

      const totalActual = selectedSprintBacklog.reduce((acc, item) => {
        return acc + (item.completionTime ? parseTimeToHours(item.completionTime) : 0);
      }, 0);

      setEstimatedHours([totalEstimated]); // Set estimated hours for the chart
      setActualHours([totalActual]); // Set actual hours for the chart
    } else {
      setEstimatedHours([]); // Clear estimated hours if no sprint is selected
      setActualHours([]); // Clear actual hours if no sprint is selected
    }
  };

  // Utility function to parse time strings (e.g., "1w 2d 3h 30m") into total hours
  const parseTimeToHours = (timeStr) => {
    const regex = /^(\d+)w\s*(\d+)d\s*(\d+)h\s*(\d+)m$/;
    const matches = timeStr.match(regex);

    if (!matches) return 0;

    const weeks = parseInt(matches[1], 10) || 0;
    const days = parseInt(matches[2], 10) || 0;
    const hours = parseInt(matches[3], 10) || 0;
    const minutes = parseInt(matches[4], 10) || 0;

    return weeks * 40 + days * 8 + hours + minutes / 60; // Assuming 1 week = 40 hours, 1 day = 8 hours
  };

  // Function to handle tab switching between Sprint Review and Developer Review
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  return (
    <div className={`charts-page theme-${theme}`}>
      <h1>Charts Dashboard</h1>

      {/* Navigation for Tabs */}
      <div id="dolphincontainer">
        <div id="dolphinnav">
          <ul>
            <li>
              <a
                href="#sprint-review-tab"
                className={activeTab === 'sprint-review' ? 'current' : ''} // Highlight current tab
                onClick={(e) => {
                  e.preventDefault(); // Prevent page reload
                  handleTabChange('sprint-review'); // Switch to Sprint Review tab
                }}
                style={{ fontSize: '22px' }}
              >
                <span>Sprint Review</span>
              </a>
            </li>
            <li>
              <a
                href="#developer-review-tab"
                className={activeTab === 'developer-review' ? 'current' : ''} // Highlight current tab
                onClick={(e) => {
                  e.preventDefault(); // Prevent page reload
                  handleTabChange('developer-review'); // Switch to Developer Review tab
                }}
                style={{ fontSize: '22px' }}
              >
                <span>Developer Review</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Sprint Selection Dropdown */}
      <div className="sprint-selection">
        <label htmlFor="sprint-dropdown">Select Sprint: </label>
        <select id="sprint-dropdown" value={selectedSprint} onChange={handleSprintSelection}>
          <option value="">-- Select a Sprint --</option>
          {sprints.map((sprint) => (
            <option key={sprint.name} value={sprint.name}>
              {sprint.name}
            </option>
          ))}
        </select>
      </div>

      {/* Sprint Review Tab Content */}
      {activeTab === 'sprint-review' && (
        <div id="sprint-review-tab" className="tab-content">
          <h2 style={{ textAlign: 'center' }}>Sprint Review</h2>

          {/* Burndown Chart */}
          <div className="chart-container">
            <h3 style={{ textAlign: 'center', fontSize: '20px' }}>Burndown Chart</h3>
            {selectedSprint ? (
              <BurndownChart sprint={sprints.find((sprint) => sprint.name === selectedSprint)} />
            ) : (
              <p>Please select a sprint to view the burndown chart.</p>
            )}
          </div>
        </div>
      )}

      {/* Developer Review Tab Content */}
      {activeTab === 'developer-review' && (
        <div id="developer-review-tab" className="tab-content">
          <h2 style={{ textAlign: 'center' }}>Developer Review</h2>

          {/* Accumulation Chart for Sprint Hours */}
          <div className="chart-container">
            <h3 style={{ textAlign: 'center', fontSize: '20px' }}>
              Accumulation of Work Hours per Sprint
            </h3>
            {selectedSprint ? (
              <AccumulationChart1 estimatedHours={estimatedHours} actualHours={actualHours} />
            ) : (
              <p>Please select a sprint to view the accumulation chart.</p>
            )}
          </div>

          {/* Accumulation Chart for Developer Hours */}
          <div className="chart-container">
            <h3 style={{ textAlign: 'center', fontSize: '20px' }}>
              Accumulation of Work Hours per Sprint for Every Developer
            </h3>
            {selectedSprint ? (
              <AccumulationChart2
                sprintBacklog={sprintBacklog.filter((item) => item.sprint === selectedSprint)}
              />
            ) : (
              <p>Please select a sprint to view the developer-wise accumulation chart.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Charts;
