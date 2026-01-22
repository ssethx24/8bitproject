import React, { useState, useEffect, useContext } from 'react';
import './Home.css';
import { ThemeContext } from '../../contexts/theme-context'; // Import the Theme Context

function HomePage() {
  const { theme } = useContext(ThemeContext); // Use the theme from context

  const [sprints, setSprints] = useState([]);
  const [sprintBacklog, setSprintBacklog] = useState([]);
  const [currentSprint, setCurrentSprint] = useState('Sprint 1'); // Default selected sprint

  // Retrieve sprints and sprint backlog from localStorage when the component mounts
  useEffect(() => {
    const storedSprints = JSON.parse(localStorage.getItem('sprints')) || [];
    const storedSprintBacklog = JSON.parse(localStorage.getItem('sprintBacklog')) || [];

    setSprints(storedSprints);
    setSprintBacklog(storedSprintBacklog);
  }, []);

  // Function to calculate sprint progress based on completed tasks
  const calculateSprintProgress = (sprint) => {
    const sprintTasks = sprintBacklog.filter(task => task.sprint === sprint.name);
    const totalTasks = sprintTasks.length;
    const completedTasksCount = sprintTasks.filter(task => task.status === 'Completed').length;
    const progressPercentage = totalTasks === 0 ? 0 : Math.floor((completedTasksCount / totalTasks) * 100);

    return progressPercentage; // Return progress percentage based solely on completed tasks
  };

  // Function to determine sprint status based on the progress parameter
  const getSprintStatus = (sprint) => {
    const progressPercentage = calculateSprintProgress(sprint); // Calculate progress percentage
    return sprint.progress; // Return the status from the sprint object
  };

  // Filter the backlog based on the current sprint
  const filteredSprintBacklog = sprintBacklog.filter(task => task.sprint === currentSprint);

  return (
    <div className={`homepage-container theme-${theme}`}> {/* Apply theme class */}
      {/* Logo Section */}
      <div className="logo-container">
<img
  src={`${process.env.PUBLIC_URL}/8bit.jpg`}
  alt="Logo"
  className="logo"
/>
      </div>

      {/* Sprint Summary Section */}
      <div className="sprint-summary">
        <h1>Sprint Overview</h1>
        {sprints.length === 0 ? (
          <p>No sprints available.</p>
        ) : (
          sprints.map(sprint => {
            const progressPercentage = calculateSprintProgress(sprint);
            const sprintStatus = getSprintStatus(sprint); // Get the status from sprint
            const sprintTasks = sprintBacklog.filter(task => task.sprint === sprint.name); // Get all tasks for this sprint
            const completedTasksCount = sprintTasks.filter(task => task.status === 'Completed').length;

            return (
              <div key={sprint.name} className="sprint-status">
                <h2>{sprint.name} - {progressPercentage}% complete</h2>
                <p>Status: {sprintStatus}</p> {/* Display status based on sprint object */}
                <p>Tasks Completed: {completedTasksCount}/{sprintTasks.length > 0 ? sprintTasks.length : 0}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Sprint Selection */}
      <div className="sprint-selection">
        <label>Select Sprint:</label>
        <select
          value={currentSprint}
          onChange={(e) => setCurrentSprint(e.target.value)}
        >
          {sprints.map((sprint) => (
            <option key={sprint.name} value={sprint.name}>{sprint.name}</option>
          ))}
        </select>
      </div>

      {/* Sprint Board Section */}
      <div className="sprint-board">
        <h2>Sprint Board</h2>
        <div className="task-board">
          {/* Awaiting Action Section */}
          <div className="task-column awaiting-action">
            <h3>Awaiting Action</h3>
            <ul>
              {filteredSprintBacklog.filter(task => task.status === 'Awaiting Action').length > 0 ? (
                filteredSprintBacklog
                  .filter(task => task.status === 'Awaiting Action')
                  .map((task, index) => <li key={index}>{task.title}</li>)
              ) : (
                <li>No tasks awaiting action</li>
              )}
            </ul>
          </div>

          {/* Under Development Section */}
          <div className="task-column in-progress">
            <h3>Under Development</h3>
            <ul>
              {filteredSprintBacklog.filter(task => task.status === 'Under Development').length > 0 ? (
                filteredSprintBacklog
                  .filter(task => task.status === 'Under Development')
                  .map((task, index) => <li key={index}>{task.title}</li>)
              ) : (
                <li>No tasks under development</li>
              )}
            </ul>
          </div>

          {/* Completed Section */}
          <div className="task-column completed">
            <h3>Completed</h3>
            <ul>
              {filteredSprintBacklog.filter(task => task.status === 'Completed').length > 0 ? (
                filteredSprintBacklog
                  .filter(task => task.status === 'Completed')
                  .map((task, index) => <li key={index}>{task.title}</li>)
              ) : (
                <li>No tasks completed</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
