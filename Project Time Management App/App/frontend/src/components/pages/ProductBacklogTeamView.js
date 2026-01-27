import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Import UUID
import AddItem from './AddItem';
import './ProductBacklog.css';
import { api } from "../api"; //

function ProductBacklogTeamView({ sprints = [], onAddToSprintBacklog }) {
  //  DB is the source of truth now
  const [backlogItems, setBacklogItems] = useState([]);

  const [sortCriteria, setSortCriteria] = useState('title');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedSprint, setSelectedSprint] = useState('');

  //  Load backlog from DB on mount
  useEffect(() => {
    const fetchBacklog = async () => {
      try {
        const res = await api.get('/api/tasks?sprint=Backlog');
        setBacklogItems(res.data || []);
      } catch (error) {
        console.error('Failed to fetch backlog items:', error);
        alert('Failed to load backlog from database.');
      }
    };

    fetchBacklog();
  }, []);

  // Count the number of items in each status
  const statusSummary = backlogItems.reduce(
    (summary, item) => {
      summary[item.status] += 1;
      return summary;
    },
    { 'Awaiting Action': 0, 'Under Development': 0, Completed: 0 }
  );

  // Add item -> POST to DB, then refresh list
  const handleAddItem = async (item) => {
    const newItem = {
      // Keep UUID for compatibility with your frontend, but backend may store its own id
      id: uuidv4(),
      title: item.title,
      priority: item.priority,
      developer: item.developer,
      status: 'Awaiting Action',
      createdAt: Date.now(),
      sprint: 'Backlog'
    };

    try {
      await api.post('/api/tasks', newItem);

      // Reload from DB so everyone sees the same tasks
      const res = await api.get('/api/tasks?sprint=Backlog');
      setBacklogItems(res.data || []);
    } catch (error) {
      console.error('Failed to add item:', error);
      alert('Failed to add item to database.');
    }
  };

  //  Developer change -> PUT to DB, then update local state
  const handleDeveloperChange = async (id, newDeveloper) => {
    // Optimistic UI update
    const updatedItems = backlogItems.map((item) =>
      item.id === id ? { ...item, developer: newDeveloper } : item
    );
    setBacklogItems(updatedItems);

    try {
      await api.put(`/api/tasks/${id}`, { developer: newDeveloper });
    } catch (error) {
      console.error('Failed to update developer:', error);
      alert('Failed to update developer in database.');

      // Re-sync with DB if update fails
      try {
        const res = await api.get('/api/tasks?sprint=Backlog');
        setBacklogItems(res.data || []);
      } catch (e) {}
    }
  };

  // Sort items
  const sortBacklogItems = (items, criteria, order) => {
    return [...items].sort((a, b) => {
      if (criteria === 'createdAt') {
        return order === 'asc' ? a.createdAt - b.createdAt : b.createdAt - a.createdAt;
      } else if (criteria === 'developer') {
        const valueA = (a.developer || '').toString().toLowerCase();
        const valueB = (b.developer || '').toString().toLowerCase();
        return order === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      }

      const valueA = (a[criteria] || '').toString().toLowerCase();
      const valueB = (b[criteria] || '').toString().toLowerCase();

      if (valueA < valueB) return order === 'asc' ? -1 : 1;
      if (valueA > valueB) return order === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Handle sorting changes
  const handleSortChange = (event) => {
    const { name, value } = event.target;
    if (name === 'criteria') {
      setSortCriteria(value);
    } else if (name === 'order') {
      setSortOrder(value);
    }
  };

  // Memoize sorted items for performance
  const sortedBacklogItems = useMemo(() => {
    return sortBacklogItems(backlogItems, sortCriteria, sortOrder);
  }, [backlogItems, sortCriteria, sortOrder]);

  // Transfer to sprint -> update sprint in DB, then refresh backlog
  const handleTransferToSprint = async (item) => {
    if (selectedSprint && typeof onAddToSprintBacklog === 'function') {
      try {
        // Update the task sprint in DB
        await api.put(`/api/tasks/${item.id}`, { sprint: selectedSprint });

        // Optional callback (kept)
        onAddToSprintBacklog(item, selectedSprint);

        // Refresh backlog list (Backlog only)
        const res = await api.get('/api/tasks?sprint=Backlog');
        setBacklogItems(res.data || []);
      } catch (error) {
        console.error('Failed to transfer item:', error);
        alert('Failed to transfer to sprint in database.');
      }
    } else {
      alert('Please select a sprint to add this item to.');
    }
  };

  return (
    <div className="product-backlog">
      <h1>Product Backlog</h1>

      {/* Status summary */}
      <div className="status-summary">
        <p>Awaiting Action: {statusSummary['Awaiting Action']}</p>
        <p>Under Development: {statusSummary['Under Development']}</p>
        <p>Completed: {statusSummary.Completed}</p>
      </div>

      {/* Sort Controls */}
      <div className="sort-controls">
        <label htmlFor="sort-by">Sort by:</label>
        <select
          id="sort-by"
          name="criteria"
          value={sortCriteria}
          onChange={handleSortChange}
        >
          <option value="title">Title</option>
          <option value="priority">Priority</option>
          <option value="status">Status</option>
          <option value="developer">Developer</option>
        </select>

        <label htmlFor="sort-order">Order:</label>
        <select
          id="sort-order"
          name="order"
          value={sortOrder}
          onChange={handleSortChange}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      {/* Add new item functionality */}
      <div className="add-task-container">
        <AddItem onAdd={handleAddItem} />
      </div>

      <table className="backlog-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Task</th>
            <th>Priority</th>
            <th>Developer</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedBacklogItems.map((item, index) => (
            <tr
              key={item.id}
              className={
                item.status === 'Awaiting Action'
                  ? 'awaiting-action'
                  : item.status === 'Under Development'
                  ? 'under-development'
                  : 'completed'
              }
            >
              <td>{index + 1}</td>
              <td>{item.title}</td>
              <td>{item.priority}</td>

              <td>
                <select
                  value={item.developer}
                  onChange={(e) => handleDeveloperChange(item.id, e.target.value)}
                >
                  <option value="Daksh">Daksh</option>
                  <option value="Chetan">Chetan</option>
                  <option value="Gaurav">Gaurav</option>
                  <option value="Shaurya">Shaurya</option>
                  <option value="Sameeksha">Sameeksha</option>
                  <option value="Simran">Simran</option>
                </select>
              </td>

              <td>{item.status}</td>

              <td>
                {typeof onAddToSprintBacklog === 'function' && (
                  <div className="transfer-actions">
                    <select
                      value={selectedSprint}
                      onChange={(e) => setSelectedSprint(e.target.value)}
                    >
                      <option value="">Select Sprint</option>
                      {sprints.length > 0 &&
                        sprints.map((sprint) => (
                          <option key={sprint.name} value={sprint.name}>
                            {sprint.name}
                          </option>
                        ))}
                    </select>
                    <button onClick={() => handleTransferToSprint(item)}>
                      Add to Sprint
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProductBacklogTeamView;