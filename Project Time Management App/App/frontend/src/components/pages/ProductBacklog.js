import React, { useState, useEffect, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import AddItem from "./AddItem";
import DeleteItem from "./DeleteItem";
import "./ProductBacklog.css";
import { api } from "../../api";

function ProductBacklog({ sprints = [], onAddToSprintBacklog }) {
  const [backlogItems, setBacklogItems] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingPriority, setEditingPriority] = useState("");
  const [editingDeveloper, setEditingDeveloper] = useState("");
  const [editingStatus, setEditingStatus] = useState("");

  const [sortCriteria, setSortCriteria] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedSprint, setSelectedSprint] = useState("");

  // ✅ Load Product Backlog from MongoDB (sprintName = null)
  useEffect(() => {
    const loadBacklog = async () => {
      try {
        const res = await api.get("/api/backlog");

        // Normalize backend shape → keep your old UI expecting item.id
        const normalized = (res.data || [])
          .filter((it) => !it.sprintName) // only product backlog items
          .map((it) => ({
            id: it.clientId || it.id || it._id, // keep "id" for UI
            title: it.title,
            priority: it.priority,
            developer: it.developer,
            status: it.status,
            completed: it.completed,
            completedInSprint: it.completedInSprint,
            createdAt: it.createdAt ? new Date(it.createdAt).getTime() : Date.now(),
          }));

        setBacklogItems(normalized);
      } catch (err) {
        console.error("❌ Failed to load backlog:", err);
        alert("Failed to load Product Backlog from server.");
      }
    };

    loadBacklog();
  }, []);

  // ✅ Add item → MongoDB
  const handleAddItem = async (item) => {
    try {
      const clientId = uuidv4();

      const payload = {
        clientId,
        title: item.title,
        priority: item.priority,
        developer: item.developer || "Daksh",
      };

      const res = await api.post("/api/backlog", payload);

      const saved = res.data;

      const newItem = {
        id: saved.clientId || clientId,
        title: saved.title,
        priority: saved.priority,
        developer: saved.developer,
        status: saved.status || "Awaiting Action",
        completed: saved.completed ?? false,
        completedInSprint: saved.completedInSprint ?? null,
        createdAt: saved.createdAt ? new Date(saved.createdAt).getTime() : Date.now(),
      };

      setBacklogItems((prev) => [...prev, newItem]);
    } catch (err) {
      console.error("❌ Add failed:", err);
      alert("Failed to add item (server error).");
    }
  };

  // ✅ Delete item → MongoDB
  const handleDeleteItem = async (id) => {
    try {
      await api.delete(`/api/backlog/${id}`);
      setBacklogItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("❌ Delete failed:", err);
      alert("Failed to delete item (server error).");
    }
  };

  // ✅ Status change → MongoDB
  const handleStatusChange = async (id, newStatus) => {
    try {
      const payload = {
        status: newStatus,
        completed: newStatus === "Completed",
        completedInSprint: newStatus === "Completed" ? selectedSprint : null,
      };

      const res = await api.put(`/api/backlog/${id}`, payload);
      const updated = res.data;

      setBacklogItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: updated.status,
                completed: updated.completed,
                completedInSprint: updated.completedInSprint,
              }
            : item
        )
      );
    } catch (err) {
      console.error("❌ Status update failed:", err);
      alert("Failed to update status (server error).");
    }
  };

  // Enable editing mode
  const handleEditItem = (id) => {
    const itemToEdit = backlogItems.find((item) => item.id === id);
    if (!itemToEdit) return;

    if (itemToEdit.completed) {
      const confirmEdit = window.confirm(
        "This item is marked as completed. Do you want to edit it?"
      );
      if (!confirmEdit) return;
    }

    setEditingId(id);
    setEditingTitle(itemToEdit.title);
    setEditingPriority(itemToEdit.priority);
    setEditingDeveloper(itemToEdit.developer);
    setEditingStatus(itemToEdit.status);
  };

  // ✅ Save edit → MongoDB
  const handleSaveEdit = async (id) => {
    try {
      const payload = {
        title: editingTitle,
        priority: editingPriority,
        developer: editingDeveloper,
        status: editingStatus,
        completed: editingStatus === "Completed",
        completedInSprint: editingStatus === "Completed" ? selectedSprint : null,
      };

      const res = await api.put(`/api/backlog/${id}`, payload);
      const updated = res.data;

      setBacklogItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                title: updated.title,
                priority: updated.priority,
                developer: updated.developer,
                status: updated.status,
                completed: updated.completed,
                completedInSprint: updated.completedInSprint,
              }
            : item
        )
      );

      setEditingId(null);
      setEditingTitle("");
      setEditingPriority("");
      setEditingDeveloper("");
      setEditingStatus("");
    } catch (err) {
      console.error("❌ Save edit failed:", err);
      alert("Failed to save changes (server error).");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle("");
    setEditingPriority("");
    setEditingDeveloper("");
    setEditingStatus("");
  };

  // Sort items (unchanged)
  const sortBacklogItems = (items, criteria, order) => {
    return [...items].sort((a, b) => {
      if (criteria === "createdAt") {
        return order === "asc" ? a.createdAt - b.createdAt : b.createdAt - a.createdAt;
      } else if (criteria === "developer") {
        const valueA = a.developer.toString().toLowerCase();
        const valueB = b.developer.toString().toLowerCase();
        return order === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      }

      const valueA = a[criteria].toString().toLowerCase();
      const valueB = b[criteria].toString().toLowerCase();

      if (valueA < valueB) return order === "asc" ? -1 : 1;
      if (valueA > valueB) return order === "asc" ? 1 : -1;
      return 0;
    });
  };

  const handleSortChange = (event) => {
    const { name, value } = event.target;
    if (name === "criteria") setSortCriteria(value);
    else if (name === "order") setSortOrder(value);
  };

  const sortedBacklogItems = useMemo(() => {
    return sortBacklogItems(backlogItems, sortCriteria, sortOrder);
  }, [backlogItems, sortCriteria, sortOrder]);

  // ✅ Transfer to sprint → persist by setting sprintName in MongoDB
  const handleTransferToSprint = async (item) => {
    if (!selectedSprint) {
      alert("Please select a sprint to add this item to.");
      return;
    }

    try {
      // Update item in DB to move into sprint
      await api.put(`/api/backlog/${item.id}`, { sprintName: selectedSprint });

      // Remove from product backlog UI
      setBacklogItems((prev) => prev.filter((x) => x.id !== item.id));

      // Keep your existing callback for sprint page UI
      if (typeof onAddToSprintBacklog === "function") {
        onAddToSprintBacklog(item, selectedSprint);
      }
    } catch (err) {
      console.error("❌ Transfer to sprint failed:", err);
      alert("Failed to transfer item to sprint (server error).");
    }
  };

  return (
    <div className="product-backlog">
      <h1>Product Backlog</h1>

      <div className="status-summary">
        <p>To do: {backlogItems.filter((item) => item.status === "Awaiting Action").length}</p>
        <p>
          In Progress: {backlogItems.filter((item) => item.status === "Under Development").length}
        </p>
        <p>Completed: {backlogItems.filter((item) => item.status === "Completed").length}</p>
      </div>

      <div className="sort-controls">
        <label htmlFor="sort-by">Sort by:</label>
        <select id="sort-by" name="criteria" value={sortCriteria} onChange={handleSortChange}>
          <option value="createdAt">Id</option>
          <option value="title">Title</option>
          <option value="priority">Priority</option>
          <option value="status">Status</option>
          <option value="developer">Developer</option>
        </select>

        <label htmlFor="sort-order">Order:</label>
        <select id="sort-order" name="order" value={sortOrder} onChange={handleSortChange}>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

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
          {sortedBacklogItems.map((item, index) => (
            <tr
              key={item.id}
              className={
                item.status === "Awaiting Action"
                  ? "awaiting-action"
                  : item.status === "Under Development"
                  ? "in-progress"
                  : item.status === "Completed"
                  ? "completed"
                  : ""
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
                  <select value={editingPriority} onChange={(e) => setEditingPriority(e.target.value)}>
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
                  <select value={editingStatus} onChange={(e) => setEditingStatus(e.target.value)}>
                    <option value="Awaiting Action">Awaiting Action</option>
                    <option value="Under Development">Under Development</option>
                    <option value="Completed">Completed</option>
                  </select>
                ) : item.completed ? (
                  <span className="completed-label">
                    Completed {item.completedInSprint ? `in ${item.completedInSprint}` : ""}
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
                  <select value={editingDeveloper} onChange={(e) => setEditingDeveloper(e.target.value)}>
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
                    <button onClick={() => handleEditItem(item.id)}>Edit</button>
                    <DeleteItem id={item.id} onDelete={handleDeleteItem} />

                    {typeof onAddToSprintBacklog === "function" && !item.completed && (
                      <>
                        <select value={selectedSprint} onChange={(e) => setSelectedSprint(e.target.value)}>
                          <option value="">Select Sprint</option>
                          {sprints.map((sprint) => (
                            <option key={sprint.name} value={sprint.name}>
                              {sprint.name}
                            </option>
                          ))}
                        </select>

                        <button onClick={() => handleTransferToSprint(item)}>Add to Sprint</button>
                      </>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProductBacklog;