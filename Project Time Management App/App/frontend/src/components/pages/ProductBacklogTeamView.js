import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Import UUID
import AddItem from './AddItem';
import './ProductBacklog.css';

function ProductBacklogTeamView({ sprints = [], onAddToSprintBacklog }) {
  const [backlogItems, setBacklogItems] = useState(() => {
    const savedItems = localStorage.getItem('backlogItems');
    return savedItems ? JSON.parse(savedItems) : [];
  });

  const [sortCriteria, setSortCriteria] = useState('title');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedSprint, setSelectedSprint] = useState('');

  // Save to local storage whenever backlogItems changes
  useEffect(() => {
    localStorage.setItem('backlogItems', JSON.stringify(backlogItems));
  }, [backlogItems]);

  // Count the number of items in each status
  const statusSummary = backlogItems.reduce(
    (summary, item) => {
      summary[item.status] += 1;
      return summary;
    },
    { 'Awaiting Action': 0, 'Under Development': 0, Completed: 0 }
  );

  // Function to add a new item to the backlog
  const handleAddItem = (item) => {
    const newItem = {
      id: uuidv4(), // Use UUID for unique ID
      title: item.title,
      priority: item.priority,
      developer: item.developer,
      status: 'Awaiting Action', // Default status
      createdAt: Date.now(), // Timestamp for ordering
    };
    setBacklogItems([...backlogItems, newItem]);
  };

  // Function to handle developer changes
  const handleDeveloperChange = (id, newDeveloper) => {
    const updatedItems = backlogItems.map((item) =>
      item.id === id ? { ...item, developer: newDeveloper } : item
    );
    setBacklogItems(updatedItems);
  };

  // Sort items
  const sortBacklogItems = (items, criteria, order) => {
    return [...items].sort((a, b) => {
      if (criteria === 'createdAt') {
        return order === 'asc' ? a.createdAt - b.createdAt : b.createdAt - a.createdAt;
      } else if (criteria === 'developer') {
        const valueA = a.developer.toString().toLowerCase();
        const valueB = b.developer.toString().toLowerCase();
        return order === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      }

      // For other criteria (e.g., title, priority, status)
      const valueA = a[criteria].toString().toLowerCase();
      const valueB = b[criteria].toString().toLowerCase();

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
  const handleTransferToSprint = (item) => {
    if (selectedSprint && typeof onAddToSprintBacklog === 'function') {
      onAddToSprintBacklog(item, selectedSprint); // Pass the selected sprint name
      handleDeleteItem(item.id); // Remove from product backlog once added to sprint backlog
    } else {
      alert('Please select a sprint to add this item to.');
    }
  };

  // Function to delete an item from the backlog (only for transferring)
  const handleDeleteItem = (id) => {
    const updatedItems = backlogItems.filter((item) => item.id !== id);
    setBacklogItems(updatedItems);
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
            <th>ID</th> {/* Sequential number based on sorted list */}
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
              {/* Sequential number */}
              <td>{index + 1}</td>

              {/* Task Title */}
              <td>{item.title}</td>

              {/* Priority */}
              <td>{item.priority}</td>

              {/* Developer */}
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

              {/* Status Display */}
              <td>{item.status}</td>

              {/* Actions */}
              <td>
                {/* Display the transfer to sprint functionality only if onAddToSprintBacklog is provided */}
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
