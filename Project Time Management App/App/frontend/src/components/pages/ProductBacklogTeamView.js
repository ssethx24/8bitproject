import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Import UUID
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
      const res = await api.get('/api/backlog');
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
    const newItem = {
      id: uuidv4(), // keep UUID (works even if backend accepts it)
      title: item.title,
      priority: item.priority,
      developer: item.developer,
      status: 'Awaiting Action',
      createdAt: Date.now(),
      completed: false,
      completedInSprint: null,
    };

    try {
      await api.post('/api/backlog', newItem);
      await fetchBacklog();
    } catch (err) {
      console.error("Failed to add backlog item:", err);
      alert("Failed to add task. Check backend.");
    }
  };

  // Update developer -> DB
  const handleDeveloperChange = async (id, newDeveloper) => {
    const existing = backlogItems.find((x) => x.id === id);
    if (!existing) return;

    try {
      await api.put(`/api/backlog/${encodeURIComponent(id)}`, {
        ...existing,
        developer: newDeveloper,
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
        const aT = a.createdAt || 0;
        const bT = b.createdAt || 0;
        return order === 'asc' ? aT - bT : bT - aT;
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

  // Function to transfer an item to the selected sprint backlog
  const handleTransferToSprint = async (item) => {
    if (selectedSprint && typeof onAddToSprintBacklog === 'function') {
      onAddToSprintBacklog(item, selectedSprint);
      await handleDeleteItem(item.id);
    } else {
      alert('Please select a sprint to add this item to.');
    }
  };

  // Delete (used for transfer) -> DB
  const handleDeleteItem = async (id) => {
    try {
      await api.delete(`/api/backlog/${encodeURIComponent(id)}`);
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
                  value={item.developer || 'Daksh'}
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
                {typeof onAddToSprintBacklog === 'function' && !item.completed && (
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