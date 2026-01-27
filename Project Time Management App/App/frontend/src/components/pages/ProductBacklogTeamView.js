import React, { useState, useEffect, useMemo } from 'react';
import AddItem from './AddItem';
import './ProductBacklog.css';
import { api } from "../../api";

function ProductBacklogTeamView({ sprints = [], onAddToSprintBacklog }) {
  const [backlogItems, setBacklogItems] = useState([]); // DB

  const [sortCriteria, setSortCriteria] = useState('title');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedSprint, setSelectedSprint] = useState('');

  // Load from DB on mount
  useEffect(() => {
    fetchBacklog();
  }, []);

  const fetchBacklog = async () => {
    try {
      // ✅ Your backend uses /api/tasks and sprint filter
      const res = await api.get('/api/tasks', { params: { sprint: "Backlog" } });
      setBacklogItems(res.data || []);
    } catch (err) {
      console.error("Failed to load backlog from database:", err);
      alert("Failed to load backlog from database. Check backend.");
    }
  };

  // Count the number of items in each status
  const statusSummary = backlogItems.reduce(
    (summary, item) => {
      const s = item.status || 'Awaiting Action';
      if (summary[s] === undefined) summary[s] = 0;
      summary[s] += 1;
      return summary;
    },
    { 'Awaiting Action': 0, 'Under Development': 0, Completed: 0 }
  );

  // Add new item -> DB
  const handleAddItem = async (item) => {
    const payload = {
      title: item.title,
      priority: item.priority,
      status: 'Awaiting Action',
      assignedTo: item.developer, // ✅ map developer -> assignedTo
      timeSpent: 0,
      sprint: "Backlog",
    };

    try {
      await api.post('/api/tasks', payload);
      await fetchBacklog();
    } catch (err) {
      console.error("Failed to add backlog item:", err);
      alert("Failed to add task. Check backend.");
    }
  };

  // Update developer -> DB
  const handleDeveloperChange = async (taskId, newDeveloper) => {
    const existing = backlogItems.find((x) => x.id === taskId);
    if (!existing) return;

    try {
      await api.put(`/api/tasks/${taskId}`, {
        ...existing,
        assignedTo: newDeveloper, // ✅ update assignedTo
      });
      await fetchBacklog();
    } catch (err) {
      console.error("Failed to update developer:", err);
      alert("Failed to update developer. Check backend.");
    }
  };

  // Sort items
  const sortBacklogItems = (items, criteria, order) => {
    return [...items].sort((a, b) => {
      if (criteria === 'createdAt') {
        // backend returns id, not createdAt; we can sort by id for "Id"
        const aT = a.id || 0;
        const bT = b.id || 0;
        return order === 'asc' ? aT - bT : bT - aT;
      } else if (criteria === 'developer') {
        const valueA = (a.assignedTo || '').toString().toLowerCase();
        const valueB = (b.assignedTo || '').toString().toLowerCase();
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

  // Transfer task to sprint -> DB update (NOT delete)
  const handleTransferToSprint = async (item) => {
    if (!selectedSprint) {
      alert('Please select a sprint to add this item to.');
      return;
    }

    try {
      // keep your existing callback (if used elsewhere)
      if (typeof onAddToSprintBacklog === 'function') {
        onAddToSprintBacklog(item, selectedSprint);
      }

      //  Persist move to sprint in DB
      await api.put(`/api/tasks/${item.id}`, {
        ...item,
        sprint: selectedSprint, // e.g. "Sprint 1"
      });

      await fetchBacklog();
    } catch (err) {
      console.error("Failed to move task to sprint:", err);
      alert("Failed to move task to sprint. Check backend.");
    }
  };

  // Delete -> DB
  const handleDeleteItem = async (taskId) => {
    try {
      await api.delete(`/api/tasks/${taskId}`);
      await fetchBacklog();
    } catch (err) {
      console.error("Failed to delete backlog item:", err);
      alert("Failed to delete task. Check backend.");
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
          <option value="createdAt">Id</option>
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
                  value={item.assignedTo || 'Daksh'}
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

                    {/* optional: allow delete */}
                    <button onClick={() => handleDeleteItem(item.id)}>
                      Delete
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