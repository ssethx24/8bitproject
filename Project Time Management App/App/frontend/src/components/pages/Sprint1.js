// src/components/pages/Sprint1.js

import React, { useState, useEffect, useContext } from 'react';
import ProductBacklog from './ProductBacklog';
import './SprintPage.css';
import { ThemeContext } from '../../contexts/theme-context';
import { api } from "../../api";

const Sprint1 = () => {
  const { theme } = useContext(ThemeContext);

  // State for sprints (keep localStorage for sprint metadata)
  const [sprints, setSprints] = useState(() => {
    const savedSprints = localStorage.getItem('sprints');
    return savedSprints ? JSON.parse(savedSprints) : [];
  });

  // State for current sprint details
  const [currentSprint, setCurrentSprint] = useState({
    name: 'Sprint 1',
    startDate: '',
    endDate: '',
    progress: 'Not Started',
  });

  // Sprint backlog items FROM DB
  const [sprintBacklog, setSprintBacklog] = useState([]);

  // Editing states
  const [isEditing, setIsEditing] = useState(false);
  const [isBacklogEditing, setIsBacklogEditing] = useState(false);

  // Sorting states for sprints
  const [sprintSortCriteria, setSprintSortCriteria] = useState('name');
  const [sprintSortOrder, setSprintSortOrder] = useState('asc');

  // Sorting states for backlog
  const [backlogSortCriteria, setBacklogSortCriteria] = useState('title');
  const [backlogSortOrder, setBacklogSortOrder] = useState('asc');
  const [backlogSortDeveloperOrder, setBacklogSortDeveloperOrder] = useState('asc');

  // Error states for time inputs
  const [estimatedTimeError, setEstimatedTimeError] = useState('');
  const [completionTimeError, setCompletionTimeError] = useState('');

  // Save sprint metadata to local storage
  useEffect(() => {
    localStorage.setItem('sprints', JSON.stringify(sprints));
  }, [sprints]);

  // ✅ Load Sprint 1 tasks from DB
  useEffect(() => {
    fetchSprintTasks();
  }, [currentSprint.name]);

  const fetchSprintTasks = async () => {
    try {
      if (!currentSprint.name) return;
      const res = await api.get('/api/tasks', { params: { sprint: currentSprint.name } });
      setSprintBacklog(res.data || []);
    } catch (err) {
      console.error("Failed to load sprint tasks:", err);
      alert("Failed to load sprint tasks. Check backend.");
    }
  };

  // Utility function
  const handleFieldChange = (field, value) => {
    const updatedSprint = { ...currentSprint, [field]: value };
    setCurrentSprint(updatedSprint);
  };

  // Save/update sprint metadata (still local)
  const handleSaveSprint = () => {
    if (!currentSprint.name) {
      alert('Sprint name is required.');
      return;
    }

    const allowedSprintNames = ['Sprint 1', 'Sprint 2', 'Sprint 3'];
    if (!allowedSprintNames.includes(currentSprint.name)) {
      alert('Invalid sprint name. Please select one from the available options.');
      return;
    }

    if (currentSprint.startDate && currentSprint.endDate && new Date(currentSprint.startDate) > new Date(currentSprint.endDate)) {
      alert('Start date cannot be after the end date.');
      return;
    }

    const isNameUsed = sprints.some((sprint) => sprint.name === currentSprint.name);
    if (isNameUsed && !isEditing) {
      alert('This sprint name has already been used.');
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
  };

  // ✅ Update task helper (DB)
  const updateTask = async (taskId, patch) => {
    try {
      await api.put(`/api/tasks/${taskId}`, patch);
      await fetchSprintTasks();
    } catch (err) {
      console.error("Failed to update task:", err);
      alert("Failed to update task. Check backend.");
    }
  };

  // ✅ Status change -> DB
  const handleStatusChange = async (id, newStatus) => {
    if (newStatus === 'Completed') {
      const sprint = sprints.find((s) => s.name === currentSprint.name);
      if (!sprint || !sprint.startDate || !sprint.endDate) {
        alert('Please set sprint start/end dates first.');
        return;
      }

      let completionDate = prompt('Enter completion date (YYYY-MM-DD):');
      if (!completionDate) {
        alert('Completion date is required.');
        return;
      }

      const date = new Date(completionDate);
      const start = new Date(sprint.startDate);
      const end = new Date(sprint.endDate);

      if (isNaN(date.getTime())) {
        alert('Invalid date format.');
        return;
      }
      if (date < start || date > end) {
        alert('Completion date must be within the sprint start and end dates.');
        return;
      }

      await updateTask(id, {
        status: 'Completed',
        completionDate,
      });
      return;
    }

    await updateTask(id, {
      status: newStatus,
      completionDate: '',
      completionTime: '',
    });
  };

  // ✅ Move task back to Product Backlog (DB)
  const handleMoveBackToProductBacklog = async (item) => {
    await updateTask(item.id, {
      sprint: "Backlog",
      status: "Awaiting Action",
      completionDate: "",
      completionTime: "",
      estimatedTime: item.estimatedTime || "",
    });
  };

  // Called when ProductBacklog “Add to Sprint” is clicked
  // ✅ just ensure DB sprint set correctly
  const handleAddToSprintBacklog = async (item, sprintName) => {
    await updateTask(item.id, {
      sprint: sprintName,
      status: "Awaiting Action",
      completionDate: "",
      completionTime: "",
      estimatedTime: item.estimatedTime || "",
    });
  };

  // Toggle backlog editing (no longer localStorage save)
  const toggleBacklogEditing = () => {
    setIsBacklogEditing(!isBacklogEditing);
    if (isBacklogEditing) alert('Sprint backlog saved to database!');
  };

  // Validation for time inputs
  const timeFormatRegex = /^(\d+w\s*)?(\d+d\s*)?(\d+h\s*)?(\d+m\s*)?$/;

  const validateTimeFormat = (time, isCompletion = false) => {
    if (!timeFormatRegex.test(time)) {
      if (isCompletion) setCompletionTimeError('Invalid format! Use format: 2w 4d 6h 45m');
      else setEstimatedTimeError('Invalid format! Use format: 2w 4d 6h 45m');
    } else {
      if (isCompletion) setCompletionTimeError('');
      else setEstimatedTimeError('');
    }
  };

  // Sorting
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
      }
      return 0;
    });
  };

  const sortBacklog = (backlog) => {
    return [...backlog].sort((a, b) => {
      if (backlogSortCriteria === 'developer') {
        const da = (a.assignedTo || '').toLowerCase();
        const dbb = (b.assignedTo || '').toLowerCase();
        return backlogSortDeveloperOrder === 'asc' ? da.localeCompare(dbb) : dbb.localeCompare(da);
      }

      const va = (a[backlogSortCriteria] || '').toString();
      const vb = (b[backlogSortCriteria] || '').toString();
      return backlogSortOrder === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  };

  const sortedSprints = sortSprints(sprints);
  const sortedSprintBacklog = sortBacklog(sprintBacklog);

  return (
    <div className={`sprint-page theme-${theme}`}>
      <h1>Sprint - 1</h1>

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
              <option key={name} value={name}>
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
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Sprint Backlog Section */}
      <div className="backlog-section">
        <h2>Sprint Backlog for {currentSprint.name || 'Select a Sprint'}</h2>

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
            <option value="developer">Developer</option>
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

        {sortedSprintBacklog.length === 0 ? (
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
                <th>Completion Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {sortedSprintBacklog.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.priority}</td>

                  <td>
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                    >
                      <option value="Awaiting Action">Awaiting Action</option>
                      <option value="Under Development">Under Development</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>

                  <td>{item.assignedTo || '--'}</td>

                  <td>
                    {item.status === 'Awaiting Action' && (
                      <>
                        <input
                          type="text"
                          placeholder="2w 4d 6h 45m"
                          value={item.estimatedTime || ''}
                          onChange={async (e) => {
                            validateTimeFormat(e.target.value);
                            await updateTask(item.id, { estimatedTime: e.target.value });
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
                          onChange={async (e) => {
                            validateTimeFormat(e.target.value, true);
                            await updateTask(item.id, { completionTime: e.target.value });
                          }}
                        />
                        {completionTimeError && <span className="error-message">{completionTimeError}</span>}
                      </>
                    )}
                  </td>

                  <td>{item.status === 'Completed' ? (item.completionDate || '--') : '--'}</td>

                  <td>
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

export default Sprint1;