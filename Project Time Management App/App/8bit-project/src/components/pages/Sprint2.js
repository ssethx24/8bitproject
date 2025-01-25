// src/components/pages/Sprint1.js

import React, { useState, useEffect, useContext } from 'react';
import ProductBacklog from './ProductBacklog';
import DeleteItem from './DeleteItem'; // Ensure this component exists
import './SprintPage.css';
import { ThemeContext } from '../../contexts/theme-context';
import BurndownChart from './BurndownChart'; // Ensure this component exists
// Uncomment if using react-datepicker
// import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';

const Sprint2 = () => {
  const { theme } = useContext(ThemeContext);

  // State for sprints
  const [sprints, setSprints] = useState(() => {
    const savedSprints = localStorage.getItem('sprints');
    return savedSprints ? JSON.parse(savedSprints) : [];
  });

  // State for current sprint details
  const [currentSprint, setCurrentSprint] = useState({
    name: '',
    startDate: '',
    endDate: '',
    progress: 'Not Started',
  });

  // State for sprint backlog items
  const [sprintBacklog, setSprintBacklog] = useState(() => {
    const savedSprintBacklog = localStorage.getItem('sprintBacklog');
    return savedSprintBacklog ? JSON.parse(savedSprintBacklog) : [];
  });

  // State for product backlog items
  const [productBacklog, setProductBacklog] = useState(() => {
    const savedItems = localStorage.getItem('backlogItems');
    return savedItems ? JSON.parse(savedItems) : [];
  });

  // Editing states
  const [isEditing, setIsEditing] = useState(false);
  const [isBacklogEditing, setIsBacklogEditing] = useState(false);

  // Sorting states for sprints
  const [sprintSortCriteria, setSprintSortCriteria] = useState('name');
  const [sprintSortOrder, setSprintSortOrder] = useState('asc');

  // Sorting states for backlog
  const [backlogSortCriteria, setBacklogSortCriteria] = useState('title');
  const [backlogSortOrder, setBacklogSortOrder] = useState('asc');
  const [backlogSortDeveloperOrder, setBacklogSortDeveloperOrder] = useState('asc'); // For developer sorting

  // Error states for time inputs
  const [estimatedTimeError, setEstimatedTimeError] = useState('');
  const [completionTimeError, setCompletionTimeError] = useState('');
  const [completionDateError, setCompletionDateError] = useState('');

  // Effect to update localStorage when sprints change
  useEffect(() => {
    localStorage.setItem('sprints', JSON.stringify(sprints));
  }, [sprints]);

  // Effect to update localStorage when sprintBacklog changes
  useEffect(() => {
    localStorage.setItem('sprintBacklog', JSON.stringify(sprintBacklog));
  }, [sprintBacklog]);

  // Effect to update localStorage when productBacklog changes
  useEffect(() => {
    localStorage.setItem('backlogItems', JSON.stringify(productBacklog));
  }, [productBacklog]);

  // Utility function to parse time strings to hours
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

  // Handler for sprint field changes
  const handleFieldChange = (field, value) => {
    const updatedSprint = { ...currentSprint, [field]: value };
    setCurrentSprint(updatedSprint);
  };

  // Handler to save or update sprint
  const handleSaveSprint = () => {
    // Validate sprint name
    if (!currentSprint.name) {
      alert('Sprint name is required.');
      return;
    }

    // Check if sprint name is allowed
    const allowedSprintNames = ['Sprint 1', 'Sprint 2', 'Sprint 3'];
    if (!allowedSprintNames.includes(currentSprint.name)) {
      alert('Invalid sprint name. Please select one from the available options.');
      return;
    }

    // Check if sprint name is already used (only when not editing)
    const isNameUsed = sprints.some((sprint) => sprint.name === currentSprint.name);
    if (isNameUsed && !isEditing) {
      alert('This sprint name has already been used. Please choose a different name.');
      return;
    }

    // Validate start and end dates
    if (currentSprint.startDate && currentSprint.endDate && new Date(currentSprint.startDate) > new Date(currentSprint.endDate)) {
      alert('Start date cannot be after the end date. Please adjust the dates.');
      return;
    }

    // Save or update sprint
    if (isEditing) {
      const updatedSprints = sprints.map((sprint) =>
        sprint.name === currentSprint.name ? currentSprint : sprint
      );
      setSprints(updatedSprints);
    } else {
      setSprints([...sprints, currentSprint]);
    }

    // Reset editing state and current sprint
    setIsEditing(false);
    setCurrentSprint({
      name: '',
      startDate: '',
      endDate: '',
      progress: 'Not Started',
    });
  };

  // Handler for changing task status
  const handleStatusChange = (id, newStatus) => {
    const updatedItems = sprintBacklog.map((item) => {
      if (item.id === id) {
        if (newStatus === 'Completed') {
          // Find the current sprint details
          const sprint = sprints.find((sprint) => sprint.name === currentSprint.name);
          if (!sprint) {
            alert('Please ensure the sprint details are correctly set.');
            return item;
          }

          // Optional: Use a date picker component instead of prompt for better UX
          // Here, we'll use a prompt for simplicity
          let completionDate = prompt('Enter completion date (YYYY-MM-DD):');

          if (completionDate) {
            const date = new Date(completionDate);
            const start = new Date(sprint.startDate);
            const end = new Date(sprint.endDate);

            if (isNaN(date.getTime())) {
              alert('Invalid date format.');
              return item;
            }

            if (date < start || date > end) {
              alert('Completion date must be within the sprint start and end dates.');
              return item;
            }

            return {
              ...item,
              status: newStatus,
              completed: true,
              completionDate: completionDate,
            };
          } else {
            alert('Completion date is required.');
            return item;
          }
        } else {
          return {
            ...item,
            status: newStatus,
            completed: newStatus === 'Completed',
            completionDate: newStatus === 'Completed' ? new Date().toISOString().split('T')[0] : '',
          };
        }
      }
      return item;
    });
    setSprintBacklog(updatedItems);
  };

  // Handler to move a task back to the product backlog
  const handleMoveBackToProductBacklog = (item) => {
    if (!productBacklog.some((backlogItem) => backlogItem.id === item.id)) {
      const originalItem = { ...item };
      originalItem.status = 'Awaiting Action'; // Reset status
      originalItem.completionDate = ''; // Reset completion date
      setProductBacklog([...productBacklog, originalItem]);
    }

    const updatedSprintBacklog = sprintBacklog.filter((task) => task.id !== item.id);
    setSprintBacklog(updatedSprintBacklog);
  };

  // Handler to add a task to the sprint backlog
  const handleAddToSprintBacklog = (item, sprintName) => {
    if (!sprintBacklog.some((backlogItem) => backlogItem.id === item.id)) {
      const newSprintBacklogItem = {
        ...item,
        sprint: sprintName,
        status: 'Awaiting Action',
        estimatedTime: '', // Initialize estimated time
        completionTime: '', // Initialize completion time
        completionDate: '', // Initialize completion date
      };
      setSprintBacklog([...sprintBacklog, newSprintBacklogItem]);

      const updatedProductBacklog = productBacklog.filter((backlogItem) => backlogItem.id !== item.id);
      setProductBacklog(updatedProductBacklog);
    }
  };

  // Handler to edit a sprint
  const handleEditSprint = (sprintName) => {
    const sprintToEdit = sprints.find((sprint) => sprint.name === sprintName);
    setCurrentSprint(sprintToEdit);
    setIsEditing(true);
  };

  // Handler to delete a sprint
  const handleDeleteSprint = (sprintName) => {
    const updatedSprints = sprints.filter((sprint) => sprint.name !== sprintName);
    setSprints(updatedSprints);

    if (currentSprint.name === sprintName) {
      setCurrentSprint({
        name: '',
        startDate: '',
        endDate: '',
        progress: 'Not Started',
      });
    }
  };

  // Handler to toggle backlog editing mode
  const toggleBacklogEditing = () => {
    if (isBacklogEditing) {
      localStorage.setItem('sprintBacklog', JSON.stringify(sprintBacklog));
      alert('Sprint backlog has been saved!');
    }
    setIsBacklogEditing(!isBacklogEditing);
  };

  // Validation for time inputs
  const timeFormatRegex = /^(\d+w\s*)?(\d+d\s*)?(\d+h\s*)?(\d+m\s*)?$/;

  const validateTimeFormat = (time, isCompletion = false) => {
    if (!timeFormatRegex.test(time)) {
      if (isCompletion) {
        setCompletionTimeError('Invalid format! Use format: 2w 4d 6h 45m');
      } else {
        setEstimatedTimeError('Invalid format! Use format: 2w 4d 6h 45m');
      }
    } else {
      if (isCompletion) {
        setCompletionTimeError('');
      } else {
        setEstimatedTimeError('');
      }
    }
  };

  // Sorting functions
  const sortSprints = (sprintsList) => {
    return [...sprintsList].sort((a, b) => {
      if (sprintSortCriteria === 'name') {
        return sprintSortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      } else if (sprintSortCriteria === 'startDate') {
        return sprintSortOrder === 'asc'
          ? new Date(a.startDate) - new Date(b.startDate)
          : new Date(b.startDate) - new Date(a.startDate);
      } else if (sprintSortCriteria === 'endDate') {
        return sprintSortOrder === 'asc'
          ? new Date(a.endDate) - new Date(b.endDate)
          : new Date(b.endDate) - new Date(a.endDate);
      } else {
        return 0;
      }
    });
  };

  const sortBacklog = (backlog) => {
    return [...backlog].sort((a, b) => {
      if (backlogSortCriteria === 'title') {
        return backlogSortOrder === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
      } else if (backlogSortCriteria === 'priority') {
        return backlogSortOrder === 'asc' ? a.priority.localeCompare(b.priority) : b.priority.localeCompare(a.priority);
      } else if (backlogSortCriteria === 'status') {
        return backlogSortOrder === 'asc' ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status);
      } else if (backlogSortCriteria === 'developer') {
        return backlogSortDeveloperOrder === 'asc' ? a.developer.localeCompare(b.developer) : b.developer.localeCompare(a.developer);
      } else {
        return 0;
      }
    });
  };

  const sortedSprints = sortSprints(sprints);
  const filteredSprintBacklog = sprintBacklog.filter(item => item.sprint === currentSprint.name);
  const sortedSprintBacklog = sortBacklog(filteredSprintBacklog);

  return (
    <div className={`sprint-page theme-${theme}`}>
      <h1>Sprint - 2</h1>

      {/* Sprint Details Section */}
      <div className="sprint-details">
        <div className="field-group">
          <label>Sprint Name: </label>
          <select
            value={currentSprint.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
          >
            <option value="">-- Select Sprint Name --</option>
            {['Sprint 1', 'Sprint 2', 'Sprint 3'].map((name) => (
              <option
                key={name}
                value={name}
                disabled={sprints.some(sprint => sprint.name === name && sprint.progress === 'Completed')}
              >
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label>Start Date: </label>
          {/* Optional: Use DatePicker for better UX */}
          <input
            type="date"
            value={currentSprint.startDate}
            onChange={(e) => handleFieldChange('startDate', e.target.value)}
          />
          {/*
          // If using react-datepicker, uncomment and use the DatePicker component
          <DatePicker
            selected={currentSprint.startDate ? new Date(currentSprint.startDate) : null}
            onChange={(date) => handleFieldChange('startDate', date.toISOString().split('T')[0])}
            dateFormat="yyyy-MM-dd"
          />
          */}
        </div>

        <div className="field-group">
          <label>End Date: </label>
          {/* Optional: Use DatePicker for better UX */}
          <input
            type="date"
            value={currentSprint.endDate}
            onChange={(e) => handleFieldChange('endDate', e.target.value)}
          />
          {/*
          // If using react-datepicker, uncomment and use the DatePicker component
          <DatePicker
            selected={currentSprint.endDate ? new Date(currentSprint.endDate) : null}
            onChange={(date) => handleFieldChange('endDate', date.toISOString().split('T')[0])}
            dateFormat="yyyy-MM-dd"
          />
          */}
        </div>

        <div className="field-group">
          <label>Progress: </label>
          <select
            value={currentSprint.progress}
            onChange={(e) => handleFieldChange('progress', e.target.value)}
          >
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <button onClick={handleSaveSprint}>
          {isEditing ? 'Save Modified Details' : 'Save Sprint'}
        </button>
      </div>

      {/* Sprints List Section */}
      <div className="sprint-list">
        <h2>Sprints</h2>

        {/* Sorting Controls for Sprints */}
        <div className="sort-controls">
          <label htmlFor="sprint-sort-criteria">Sort by:</label>
          <select
            id="sprint-sort-criteria"
            value={sprintSortCriteria}
            onChange={(e) => setSprintSortCriteria(e.target.value)}
          >
            <option value="name">Name</option>
            <option value="startDate">Start Date</option>
            <option value="endDate">End Date</option>
          </select>

          <label htmlFor="sprint-sort-order">Order:</label>
          <select
            id="sprint-sort-order"
            value={sprintSortOrder}
            onChange={(e) => setSprintSortOrder(e.target.value)}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        {sprints.length === 0 ? (
          <p>No sprints available.</p>
        ) : (
          <ul>
            {sortedSprints.map((sprint) => (
              <li key={sprint.name} className="sprint-item">
                <div><strong>Name:</strong> {sprint.name}</div>
                <div><strong>Start Date:</strong> {sprint.startDate}</div>
                <div><strong>End Date:</strong> {sprint.endDate}</div>
                <div><strong>Progress:</strong> {sprint.progress}</div>
                {/* Only show Edit and Delete buttons for "Sprint 1" */}
                {sprint.name === 'Sprint 2' && (
                  <>
                    <button onClick={() => handleEditSprint(sprint.name)}>Edit</button>
                    <button onClick={() => handleDeleteSprint(sprint.name)}>Delete</button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Sprint Backlog Section */}
      <div className="backlog-section">
        <h2>Sprint Backlog for {currentSprint.name || 'Select a Sprint'}</h2>

        {/* Sorting Controls for Backlog */}
        <div className="sort-controls">
          <label htmlFor="backlog-sort-criteria">Sort by:</label>
          <select
            id="backlog-sort-criteria"
            value={backlogSortCriteria}
            onChange={(e) => setBacklogSortCriteria(e.target.value)}
          >
            <option value="title">Title</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
            <option value="developer">Developer</option> {/* Added sorting by developer */}
          </select>

          <label htmlFor="backlog-sort-order">Order:</label>
          <select
            id="backlog-sort-order"
            value={backlogSortOrder}
            onChange={(e) => setBacklogSortOrder(e.target.value)}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>

          {/* Additional Sorting for Developer */}
          <label htmlFor="backlog-sort-developer-order">Developer Order:</label>
          <select
            id="backlog-sort-developer-order"
            value={backlogSortDeveloperOrder}
            onChange={(e) => setBacklogSortDeveloperOrder(e.target.value)}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        {filteredSprintBacklog.length === 0 ? (
          <p>No items in sprint backlog</p>
        ) : (
          <table className="backlog-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Developer</th>
                <th>Estimated Time</th>
                <th>Completion Time</th>
                <th>Completion Date</th> {/* New Column */}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedSprintBacklog.map((item) => (
                <tr
                  key={item.id}
                  className={
                    item.status === 'Awaiting Action'
                      ? 'awaiting-action'
                      : item.status === 'Under Development'
                      ? 'in-progress'
                      : item.status === 'Completed'
                      ? 'completed'
                      : ''
                  }
                >
                  <td>{item.title}</td>
                  <td>{item.priority}</td>
                  <td>
                    <select
                      value={item.completed ? 'Completed' : item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                    >
                      <option value="Awaiting Action">Awaiting Action</option>
                      <option value="Under Development">Under Development</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                  <td>{item.developer}</td>
                  <td>
                    {item.status === 'Awaiting Action' && (
                      <>
                        <input
                          type="text"
                          placeholder="2w 4d 6h 45m"
                          value={item.estimatedTime || ''}
                          onChange={(e) => {
                            const updatedItem = { ...item, estimatedTime: e.target.value };
                            validateTimeFormat(e.target.value); // Validate input
                            setSprintBacklog((prev) =>
                              prev.map((backlogItem) =>
                                backlogItem.id === item.id ? updatedItem : backlogItem
                              )
                            );
                          }}
                        />
                        {estimatedTimeError && <span className="error-message">{estimatedTimeError}</span>}
                      </>
                    )}
                  </td>
                  <td>
                    {item.status === 'Completed' && (
                      <>
                        <input
                          type="text"
                          placeholder="2w 4d 6h 45m"
                          value={item.completionTime || ''}
                          onChange={(e) => {
                            const updatedItem = { ...item, completionTime: e.target.value };
                            validateTimeFormat(e.target.value, true); // Validate input for completion
                            setSprintBacklog((prev) =>
                              prev.map((backlogItem) =>
                                backlogItem.id === item.id ? updatedItem : backlogItem
                              )
                            );
                          }}
                        />
                        {completionTimeError && <span className="error-message">{completionTimeError}</span>}
                      </>
                    )}
                  </td>
                  <td>
                    {item.status === 'Completed' ? (
                      item.completionDate
                    ) : (
                      '--'
                    )}
                  </td>
                  <td>
                    {/* Show Move to PB button only if status is "Awaiting Action" */}
                    {item.status === 'Awaiting Action' && (
                      <button onClick={() => handleMoveBackToProductBacklog(item)}>
                        Move to Product Backlog
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button onClick={toggleBacklogEditing}>
        {isBacklogEditing ? 'Save Sprint Backlog' : 'Edit Backlog'}
      </button>

      {/* Product Backlog Component */}
      <ProductBacklog
        sprints={sprints}
        onAddToSprintBacklog={handleAddToSprintBacklog}
      />


    </div>
  );
};

export default Sprint2;
