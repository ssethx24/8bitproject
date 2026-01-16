import React, { useState, useEffect, useContext } from 'react';
import ProductBacklog from './ProductBacklogTeamView'; // Importing the ProductBacklog component
import DeleteItem from './DeleteItem'; // Ensure you have this component
import './SprintPage.css'; // Importing the SprintPage CSS for styling
import { ThemeContext } from '../../contexts/theme-context'; // Import the Theme Context

const Sprint2= () => {
  const defaultSprintName = ''; // Default value for the sprint name
  const allowedSprintNames = ['Sprint 1', 'Sprint 2', 'Sprint 3']; // Allowed sprint names for validation

  const { theme } = useContext(ThemeContext); // Use the theme from context

  // State to store the list of sprints, initialized from localStorage
  const [sprints, setSprints] = useState(() => {
    const savedSprints = localStorage.getItem('sprints');
    return savedSprints ? JSON.parse(savedSprints) : []; // Parse saved sprints from localStorage or return an empty array
  });

   // State to manage the currently selected sprint details
  const [currentSprint, setCurrentSprint] = useState({
    name: defaultSprintName, // Sprint name
    startDate: '', // Start date of the sprint
    endDate: '', // End date of the sprint
    progress: 'Not Started', // Progress status of the sprint
  });

  // State to manage the sprint backlog, initialized from localStorage
  const [sprintBacklog, setSprintBacklog] = useState(() => {
    const savedSprintBacklog = localStorage.getItem('sprintBacklog');
    return savedSprintBacklog ? JSON.parse(savedSprintBacklog) : [];
  });

  // State to manage the product backlog, initialized from localStorage
  const [productBacklog, setProductBacklog] = useState(() => {
    const savedItems = localStorage.getItem('backlogItems');
    return savedItems ? JSON.parse(savedItems) : [];
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isBacklogEditing, setIsBacklogEditing] = useState(false);

  // State for sprint sorting
  const [sprintSortCriteria, setSprintSortCriteria] = useState('name');
  const [sprintSortOrder, setSprintSortOrder] = useState('asc');

  // State for backlog sorting
  const [backlogSortCriteria, setBacklogSortCriteria] = useState('title');
  const [backlogSortOrder, setBacklogSortOrder] = useState('asc');
  const [backlogSortDeveloperOrder, setBacklogSortDeveloperOrder] = useState('asc'); // New state for developer sorting

  const [estimatedTimeError, setEstimatedTimeError] = useState(''); // State to track input error for estimated time
  const [completionTimeError, setCompletionTimeError] = useState(''); // State to track input error for completion time

  // Regex to match format like "2w 4d 6h 45m"
  const timeFormatRegex = /^(\d+w\s*)?(\d+d\s*)?(\d+h\s*)?(\d+m\s*)?$/;

  useEffect(() => {
    localStorage.setItem('sprints', JSON.stringify(sprints));
  }, [sprints]);

  useEffect(() => {
    localStorage.setItem('sprintBacklog', JSON.stringify(sprintBacklog));
  }, [sprintBacklog]);

  useEffect(() => {
    localStorage.setItem('backlogItems', JSON.stringify(productBacklog));
  }, [productBacklog]);

  const handleFieldChange = (field, value) => {
    const updatedSprint = { ...currentSprint, [field]: value };
    setCurrentSprint(updatedSprint);
  };

  const handleSaveSprint = () => {
    if (!allowedSprintNames.includes(currentSprint.name)) {
      alert('Invalid sprint name. Please select one from the available options.');
      return;
    }

    const isNameUsed = sprints.some((sprint) => sprint.name === currentSprint.name);
    if (isNameUsed && !isEditing) {
      alert('This sprint name has already been used. Please choose a different name.');
      return;
    }

    if (currentSprint.startDate && currentSprint.endDate && currentSprint.startDate > currentSprint.endDate) {
      alert('Start date cannot be after the end date. Please adjust the dates.');
      return;
    }

    if (isEditing) {
      const updatedSprints = sprints.map((sprint) =>
        sprint.name === currentSprint.name ? currentSprint : sprint
      );
      setSprints(updatedSprints);
    } else {
      setSprints([...sprints, currentSprint]);
    }

    setIsEditing(false);
    setCurrentSprint({
      name: defaultSprintName,
      startDate: '',
      endDate: '',
      progress: 'Not Started',
    });
  };

  const handleStatusChange = (id, newStatus) => {
    const updatedItems = sprintBacklog.map((item) =>
      item.id === id
        ? {
            ...item,
            status: newStatus,
            completed: newStatus === 'Completed', // Set completed status based on new status
          }
        : item
    );
    setSprintBacklog(updatedItems);
  };

  const handleMoveBackToProductBacklog = (item) => {
    if (!productBacklog.some((backlogItem) => backlogItem.id === item.id)) {
      const originalItem = { ...item };
      originalItem.status = 'Awaiting Action'; // Reset status to Awaiting Action in Product Backlog
      setProductBacklog([...productBacklog, originalItem]);
    }

    const updatedSprintBacklog = sprintBacklog.filter((task) => task.id !== item.id);
    setSprintBacklog(updatedSprintBacklog);
  };

  const handleAddToSprintBacklog = (item, sprintName) => {
    if (!sprintBacklog.some((backlogItem) => backlogItem.id === item.id)) {
      const newSprintBacklogItem = {
        ...item,
        sprint: sprintName,
        status: 'Awaiting Action',
        estimatedTime: '', // Add estimated time field
        completionTime: '', // Add completion time field
      };
      setSprintBacklog([...sprintBacklog, newSprintBacklogItem]);

      const updatedProductBacklog = productBacklog.filter((backlogItem) => backlogItem.id !== item.id);
      setProductBacklog(updatedProductBacklog);
    }
  };

  const handleEditSprint = (sprintName) => {
    const sprintToEdit = sprints.find((sprint) => sprint.name === sprintName);
    setCurrentSprint(sprintToEdit);
    setIsEditing(true);
  };

  const handleDeleteSprint = (sprintName) => {
    const updatedSprints = sprints.filter((sprint) => sprint.name !== sprintName);
    setSprints(updatedSprints);

    if (currentSprint.name === sprintName) {
      setCurrentSprint({
        name: defaultSprintName,
        startDate: '',
        endDate: '',
        progress: 'Not Started',
      });
    }
  };

  const toggleBacklogEditing = () => {
    if (isBacklogEditing) {
      localStorage.setItem('sprintBacklog', JSON.stringify(sprintBacklog));
      alert('Sprint backlog has been saved!');
    }
    setIsBacklogEditing(!isBacklogEditing);
  };

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

  const filteredSprintBacklog = sprintBacklog.filter(item => item.sprint === currentSprint.name);

  const sortSprints = (sprints) => {
    return [...sprints].sort((a, b) => {
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
      } else if (backlogSortCriteria === 'developer') { // New sorting by developer
        return backlogSortDeveloperOrder === 'asc' ? a.developer.localeCompare(b.developer) : b.developer.localeCompare(a.developer);
      } else {
        return 0;
      }
    });
  };

  const sortedSprints = sortSprints(sprints);
  const sortedSprintBacklog = sortBacklog(filteredSprintBacklog);

  return (
    <div className={`sprint-page theme-${theme}`}> {/* Apply theme class */}
      <h1>Sprint - 2</h1>

      <div className="sprint-details">
        <div className="field-group">
          <label>Sprint Name: </label>
          <select
            value={currentSprint.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
          >
            <option value={defaultSprintName}>{defaultSprintName}</option>
            {allowedSprintNames.map((name) => (
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
          <input
            type="date"
            value={currentSprint.startDate}
            onChange={(e) => handleFieldChange('startDate', e.target.value)}
          />
        </div>

        <div className="field-group">
          <label>End Date: </label>
          <input
            type="date"
            value={currentSprint.endDate}
            onChange={(e) => handleFieldChange('endDate', e.target.value)}
          />
        </div>

        <div className="field-group">
          <label>Progress: </label>
          <select
            value={currentSprint.progress}
            onChange={(e) => {
              const newProgress = e.target.value;
              handleFieldChange('progress', newProgress);
            }}
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
                {/* Only show Edit and Delete buttons for "Sprint 2" */}
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

      <div className="backlog-section">
        <h2>Sprint Backlog for {currentSprint.name}</h2>

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
                <th>Developer</th> {/* New column for Developer */}
                <th>Estimated Time</th> {/* New column for estimated time */}
                <th>Completion Time</th> {/* New column for completion time */}
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
                      value={item.completed ? 'Completed' : item.status} // Show "Completed" or current status
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                    >
                      <option value="Awaiting Action">Awaiting Action</option>
                      <option value="Under Development">Under Development</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                  <td>{item.developer}</td> {/* Display developer name */}
                  <td>
                    {item.status === 'Awaiting Action' && (
                      <>
                        <input
                          type="text"
                          placeholder="Estimated Time (e.g. 2w 4d 6h 45m)"
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
                          placeholder="Completion Time (e.g. 2w 4d 6h 45m)"
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

      <ProductBacklog
        sprints={sprints}
        onAddToSprintBacklog={handleAddToSprintBacklog}
      />
    </div>
  );
};

export default Sprint2;
