import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Import UUID
import AddItem from './AddItem';
import DeleteItem from './DeleteItem';
import './ProductBacklog.css';

/**
 * @file ProductBacklog.js
 * @description This component manages the product backlog for a project. It allows users 
 * to add, edit, delete, and sort backlog items. Each item has attributes such as title, 
 * priority, developer, and status. The component also supports transferring items to a 
 * selected sprint backlog and saving the backlog state to local storage.
 * 
 * @component
 * @param {Array} sprints - An array of sprint objects to select from when transferring items to a sprint backlog.
 * @param {function} onAddToSprintBacklog - Callback function to handle transferring an item to the selected sprint backlog.
 * 
 * @example
 * <ProductBacklog sprints={sprintArray} onAddToSprintBacklog={handleAddToSprintBacklog} />
 * 
 * @dependencies
 * - react: Core library for building the component.
 * - uuid: Library for generating unique identifiers for backlog items.
 * - AddItem: Custom component for adding new items to the backlog.
 * - DeleteItem: Custom component for deleting backlog items.
 * - ProductBacklog.css: CSS for styling the product backlog.
 * 
 * @notes
 * - Items can be sorted based on various criteria (createdAt, title, priority, status, developer).
 * - The backlog items are saved to local storage, ensuring persistence across sessions.
 * - Includes a status summary displaying the count of items in each status category (To do, In Progress, Completed).
 * - Supports editing of existing items and confirms actions when necessary.
 */


function ProductBacklog({ sprints = [], onAddToSprintBacklog }) {
  const [backlogItems, setBacklogItems] = useState(() => {
    const savedItems = localStorage.getItem('backlogItems');
    return savedItems ? JSON.parse(savedItems) : [];
  });

  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingPriority, setEditingPriority] = useState('');
  const [editingDeveloper, setEditingDeveloper] = useState('');
  const [editingStatus, setEditingStatus] = useState('');

  const [sortCriteria, setSortCriteria] = useState('createdAt'); // Default to sorting by creation time
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedSprint, setSelectedSprint] = useState('');

  // Save to local storage whenever backlogItems changes
  useEffect(() => {
    localStorage.setItem('backlogItems', JSON.stringify(backlogItems));
  }, [backlogItems]);

  // Function to add a new item to the backlog
  const handleAddItem = (item) => {
    const newItem = {
      id: uuidv4(), // Use UUID for unique ID
      title: item.title,
      priority: item.priority,
      developer: item.developer || 'Daksh', // Set default to 'Daksh' if not provided
      status: 'Awaiting Action', // Default status
      completed: false,
      completedInSprint: null,
      createdAt: Date.now(), // Timestamp for ordering
    };
    setBacklogItems([...backlogItems, newItem]);
  };

  // Function to delete an item from the backlog
  const handleDeleteItem = (id) => {
    const updatedItems = backlogItems.filter((item) => item.id !== id);
    setBacklogItems(updatedItems);
  };

  // Function to handle status changes
  const handleStatusChange = (id, newStatus) => {
    const updatedItems = backlogItems.map((item) =>
      item.id === id
        ? {
            ...item,
            status: newStatus,
            completed: newStatus === 'Completed',
            completedInSprint: newStatus === 'Completed' ? selectedSprint : item.completedInSprint,
          }
        : item
    );
    setBacklogItems(updatedItems);
  };

  // Enable editing mode for a specific item
  const handleEditItem = (id) => {
    const itemToEdit = backlogItems.find((item) => item.id === id);
    if (!itemToEdit) return;

    // Optional: Confirm if editing a completed item
    if (itemToEdit.completed) {
      const confirmEdit = window.confirm(
        'This item is marked as completed. Do you want to edit it?'
      );
      if (!confirmEdit) {
        return;
      }
    }

    setEditingId(id);
    setEditingTitle(itemToEdit.title);
    setEditingPriority(itemToEdit.priority);
    setEditingDeveloper(itemToEdit.developer);
    setEditingStatus(itemToEdit.status); // Initialize status for editing
  };

  // Save the edited item
  const handleSaveEdit = (id) => {
    const updatedItems = backlogItems.map((item) =>
      item.id === id
        ? {
            ...item,
            title: editingTitle,
            priority: editingPriority,
            developer: editingDeveloper,
            status: editingStatus,
            completed: editingStatus === 'Completed',
            completedInSprint:
              editingStatus === 'Completed' ? selectedSprint : item.completedInSprint,
          }
        : item
    );
    setBacklogItems(updatedItems);
    setEditingId(null); // Exit edit mode
    // Reset editing states
    setEditingTitle('');
    setEditingPriority('');
    setEditingDeveloper('');
    setEditingStatus('');
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
    setEditingPriority('');
    setEditingDeveloper('');
    setEditingStatus('');
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

  return (
    <div className="product-backlog">
      <h1>Product Backlog</h1>

      {/* Status summary */}
      <div className="status-summary">
        <p>To do: {backlogItems.filter(item => item.status === 'Awaiting Action').length}</p>
        <p>In Progress: {backlogItems.filter(item => item.status === 'Under Development').length}</p>
        <p>Completed: {backlogItems.filter(item => item.status === 'Completed').length}</p>
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
          <option value="createdAt">Id</option>
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
            <th>Status</th>
            <th>Developer</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedBacklogItems.map((item, index) => {
            console.log('Rendering item:', item.id, 'Editing ID:', editingId);
            return (
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
                <td>{index + 1}</td>
                <td>
                  {editingId === item.id ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                    />
                  ) : (
                    item.title
                  )}
                </td>
                <td>
                  {editingId === item.id ? (
                    <select
                      value={editingPriority}
                      onChange={(e) => setEditingPriority(e.target.value)}
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  ) : (
                    item.priority
                  )}
                </td>
                <td>
                  {editingId === item.id ? (
                    <select
                      value={editingStatus}
                      onChange={(e) => setEditingStatus(e.target.value)}
                    >
                      <option value="Awaiting Action">Awaiting Action</option>
                      <option value="Under Development">Under Development</option>
                      <option value="Completed">Completed</option>
                    </select>
                  ) : item.completed ? (
                    <span className="completed-label">
                      Completed {item.completedInSprint ? `in ${item.completedInSprint}` : ''}
                    </span>
                  ) : (
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                    >
                      <option value="Awaiting Action">Awaiting Action</option>
                      <option value="Under Development">Under Development</option>
                      <option value="Completed">Completed</option>
                    </select>
                  )}
                </td>
                <td>
                  {editingId === item.id ? (
                    <select
                      value={editingDeveloper}
                      onChange={(e) => setEditingDeveloper(e.target.value)}
                    >
                      <option value="Daksh">Daksh</option>
                      <option value="Chetan">Chetan</option>
                      <option value="Gaurav">Gaurav</option>
                      <option value="Shaurya">Shaurya</option>
                      <option value="Sameeksha">Sameeksha</option>
                      <option value="Simran">Simran</option>
                    </select>
                  ) : (
                    item.developer
                  )}
                </td>
                <td>
                  {editingId === item.id ? (
                    <>
                      <button onClick={() => handleSaveEdit(item.id)}>Save</button>
                      <button onClick={handleCancelEdit}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEditItem(item.id)}>
                        Edit
                      </button>
                      <DeleteItem id={item.id} onDelete={handleDeleteItem} />
                      {/* Display the transfer to sprint functionality only if onAddToSprintBacklog is provided */}
                      {typeof onAddToSprintBacklog === 'function' && !item.completed && (
                        <>
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
                        </>
                      )}
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ProductBacklog;
