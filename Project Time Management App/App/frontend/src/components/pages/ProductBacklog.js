import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import AddItem from './AddItem';
import DeleteItem from './DeleteItem';
import './ProductBacklog.css';
import { api } from "../../api";


function ProductBacklog({ sprints = [], onAddToSprintBacklog }) {
  // CHANGED: start empty; load from DB
  const [backlogItems, setBacklogItems] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingPriority, setEditingPriority] = useState('');
  const [editingDeveloper, setEditingDeveloper] = useState('');
  const [editingStatus, setEditingStatus] = useState('');

  const [sortCriteria, setSortCriteria] = useState('createdAt'); // kept
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedSprint, setSelectedSprint] = useState('');

  // ADDED: fetch tasks from DB
  const fetchBacklogItems = async () => {
    try {
      const res = await api.get('/api/tasks?sprint=Backlog');
      const normalized = (res.data || []).map((t) => ({
        // keep fields your UI expects
        id: t.id,
        title: t.title,
        priority: t.priority,
        developer: t.assignedTo || 'Daksh',
        status: t.status || 'Awaiting Action',
        completed: (t.status || '') === 'Completed',
        completedInSprint: null, // you had this; backend doesn't store yet
        createdAt: t.id, // keep sorting stable; DB doesn't send createdAt
      }));
      setBacklogItems(normalized);
    } catch (err) {
      console.error("Failed to fetch backlog items:", err);
      alert("Failed to load backlog from database.");
    }
  };

  // CHANGED: load from DB on mount
  useEffect(() => {
    fetchBacklogItems();
  }, []);

  // ❌ REMOVED localStorage save (this is now DB)
  // useEffect(() => {
  //   localStorage.setItem('backlogItems', JSON.stringify(backlogItems));
  // }, [backlogItems]);

  // CHANGED: add item -> POST to DB
  const handleAddItem = async (item) => {
    try {
      await api.post('/api/tasks', {
        title: item.title,
        priority: item.priority,
        status: 'Awaiting Action',
        assignedTo: item.developer || 'Daksh',
        timeSpent: 0,
        sprint: "Backlog",
      });

      await fetchBacklogItems();
    } catch (err) {
      console.error("Failed to add task:", err);
      alert("Failed to add task to database.");
    }
  };

  // CHANGED: delete item -> DELETE in DB
  const handleDeleteItem = async (id) => {
    try {
      await api.delete(`/api/tasks/${id}`);
      await fetchBacklogItems();
    } catch (err) {
      console.error("Failed to delete task:", err);
      alert("Failed to delete task from database.");
    }
  };

  // CHANGED: status change -> PUT in DB
  const handleStatusChange = async (id, newStatus) => {
    try {
      // keep your local logic conceptually, but persist to DB
      const item = backlogItems.find((x) => x.id === id);
      if (!item) return;

      await api.put(`/api/tasks/${id}`, {
        status: newStatus,
      });

      await fetchBacklogItems();
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update status in database.");
    }
  };

  // Enable editing mode for a specific item (unchanged)
  const handleEditItem = (id) => {
    const itemToEdit = backlogItems.find((item) => item.id === id);
    if (!itemToEdit) return;

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
    setEditingStatus(itemToEdit.status);
  };

  // CHANGED: save edit -> PUT in DB
  const handleSaveEdit = async (id) => {
    try {
      await api.put(`/api/tasks/${id}`, {
        title: editingTitle,
        priority: editingPriority,
        assignedTo: editingDeveloper,
        status: editingStatus,
      });

      setEditingId(null);
      setEditingTitle('');
      setEditingPriority('');
      setEditingDeveloper('');
      setEditingStatus('');

      await fetchBacklogItems();
    } catch (err) {
      console.error("Failed to save edit:", err);
      alert("Failed to update task in database.");
    }
  };

  // Cancel editing (unchanged)
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
    setEditingPriority('');
    setEditingDeveloper('');
    setEditingStatus('');
  };

  // Sort items (unchanged)
  const sortBacklogItems = (items, criteria, order) => {
    return [...items].sort((a, b) => {
      if (criteria === 'createdAt') {
        return order === 'asc' ? a.createdAt - b.createdAt : b.createdAt - a.createdAt;
      } else if (criteria === 'developer') {
        const valueA = a.developer.toString().toLowerCase();
        const valueB = b.developer.toString().toLowerCase();
        return order === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      }

      const valueA = a[criteria].toString().toLowerCase();
      const valueB = b[criteria].toString().toLowerCase();

      if (valueA < valueB) return order === 'asc' ? -1 : 1;
      if (valueA > valueB) return order === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Handle sorting changes (unchanged)
  const handleSortChange = (event) => {
    const { name, value } = event.target;
    if (name === 'criteria') {
      setSortCriteria(value);
    } else if (name === 'order') {
      setSortOrder(value);
    }
  };

  // Memoize sorted items (unchanged)
  const sortedBacklogItems = useMemo(() => {
    return sortBacklogItems(backlogItems, sortCriteria, sortOrder);
  }, [backlogItems, sortCriteria, sortOrder]);

  // CHANGED: transfer to sprint should also update DB sprint
  const handleTransferToSprint = async (item) => {
    if (selectedSprint && typeof onAddToSprintBacklog === 'function') {
      try {
        // update DB sprint field
        await api.put(`/api/tasks/${item.id}`, {
          sprint: selectedSprint
        });

        // keep your existing behavior too
        onAddToSprintBacklog(item, selectedSprint);
        await fetchBacklogItems();
      } catch (err) {
        console.error("Failed to transfer to sprint:", err);
        alert("Failed to transfer task to sprint in database.");
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
            <th>ID</th>
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