import React, { useState, useEffect, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import AddItem from "./AddItem";
import "./ProductBacklog.css";
import { api } from "../../api";

function ProductBacklogTeamView({ sprints = [], onAddToSprintBacklog }) {
  const [backlogItems, setBacklogItems] = useState([]);

  const [sortCriteria, setSortCriteria] = useState("title");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedSprint, setSelectedSprint] = useState("");

  // ✅ Load backlog from MongoDB (only items not assigned to sprint)
  useEffect(() => {
    const loadBacklog = async () => {
      try {
        const res = await api.get("/api/backlog");

        const normalized = (res.data || [])
          .filter((it) => !it.sprintName) // product backlog only
          .map((it) => ({
            id: it.clientId || it.id || it._id,
            title: it.title,
            priority: it.priority,
            developer: it.developer || "Daksh",
            status: it.status || "Awaiting Action",
            completed: it.completed ?? false,
            completedInSprint: it.completedInSprint ?? null,
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

  // ✅ Status summary (computed from state)
  const statusSummary = backlogItems.reduce(
    (summary, item) => {
      summary[item.status] = (summary[item.status] || 0) + 1;
      return summary;
    },
    { "Awaiting Action": 0, "Under Development": 0, Completed: 0 }
  );

  // ✅ Add item → MongoDB (if you want team to add items)
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
        developer: saved.developer || "Daksh",
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

  // ✅ Update developer → MongoDB
  const handleDeveloperChange = async (id, newDeveloper) => {
    try {
      const res = await api.put(`/api/backlog/${id}`, { developer: newDeveloper });
      const updated = res.data;

      setBacklogItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, developer: updated.developer } : item
        )
      );
    } catch (err) {
      console.error("❌ Developer update failed:", err);
      alert("Failed to update developer (server error).");
    }
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

  // ✅ Transfer to sprint → persist in MongoDB by setting sprintName
  const handleTransferToSprint = async (item) => {
    if (!selectedSprint) {
      alert("Please select a sprint to add this item to.");
      return;
    }

    try {
      await api.put(`/api/backlog/${item.id}`, { sprintName: selectedSprint });

      // Remove from product backlog UI once moved to sprint
      setBacklogItems((prev) => prev.filter((x) => x.id !== item.id));

      // Keep existing callback (optional)
      if (typeof onAddToSprintBacklog === "function") {
        onAddToSprintBacklog(item, selectedSprint);
      }
    } catch (err) {
      console.error("❌ Transfer failed:", err);
      alert("Failed to transfer item to sprint (server error).");
    }
  };

  // ✅ Delete (only used when transferring or if you later add delete UI)
  const handleDeleteItem = async (id) => {
    try {
      await api.delete(`/api/backlog/${id}`);
      setBacklogItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("❌ Delete failed:", err);
      alert("Failed to delete item (server error).");
    }
  };

  return (
    <div className="product-backlog">
      <h1>Product Backlog</h1>

      <div className="status-summary">
        <p>Awaiting Action: {statusSummary["Awaiting Action"]}</p>
        <p>Under Development: {statusSummary["Under Development"]}</p>
        <p>Completed: {statusSummary.Completed}</p>
      </div>

      <div className="sort-controls">
        <label htmlFor="sort-by">Sort by:</label>
        <select id="sort-by" name="criteria" value={sortCriteria} onChange={handleSortChange}>
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
                item.status === "Awaiting Action"
                  ? "awaiting-action"
                  : item.status === "Under Development"
                  ? "under-development"
                  : "completed"
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
                {typeof onAddToSprintBacklog === "function" && !item.completed && (
                  <div className="transfer-actions">
                    <select value={selectedSprint} onChange={(e) => setSelectedSprint(e.target.value)}>
                      <option value="">Select Sprint</option>
                      {sprints.map((sprint) => (
                        <option key={sprint.name} value={sprint.name}>
                          {sprint.name}
                        </option>
                      ))}
                    </select>

                    <button onClick={() => handleTransferToSprint(item)}>Add to Sprint</button>
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