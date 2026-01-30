// src/components/pages/Sprint1.js
import React, { useState, useEffect, useContext, useMemo } from "react";
import ProductBacklog from "./ProductBacklog";
import "./SprintPage.css";
import { ThemeContext } from "../../contexts/theme-context";
import { api } from "../../api";

// Allowed sprint names (same as backend)
const ALLOWED_SPRINT_NAMES = ["Sprint 1", "Sprint 2", "Sprint 3"];

// Regex for "2w 4d 6h 45m" style input
const timeFormatRegex = /^(\d+w\s*)?(\d+d\s*)?(\d+h\s*)?(\d+m\s*)?$/;

const Sprint2 = () => {
  const { theme } = useContext(ThemeContext);

  /* ============================
     DB-backed state (NO localStorage)
  ============================ */
  const [sprints, setSprints] = useState([]);
  const [currentSprint, setCurrentSprint] = useState({
    name: "",
    startDate: "",
    endDate: "",
    progress: "Not Started",
  });

  const [sprintBacklog, setSprintBacklog] = useState([]);

  // Sorting states for sprints
  const [sprintSortCriteria, setSprintSortCriteria] = useState("name");
  const [sprintSortOrder, setSprintSortOrder] = useState("asc");

  // Sorting states for backlog
  const [backlogSortCriteria, setBacklogSortCriteria] = useState("title");
  const [backlogSortOrder, setBacklogSortOrder] = useState("asc");
  const [backlogSortDeveloperOrder, setBacklogSortDeveloperOrder] = useState("asc");

  // Error states for time inputs
  const [estimatedTimeError, setEstimatedTimeError] = useState("");
  const [completionTimeError, setCompletionTimeError] = useState("");

  /* ============================
     Helpers
  ============================ */
  const validateTimeFormat = (time, isCompletion = false) => {
    if (!timeFormatRegex.test(time)) {
      if (isCompletion) setCompletionTimeError("Invalid format! Use format: 2w 4d 6h 45m");
      else setEstimatedTimeError("Invalid format! Use format: 2w 4d 6h 45m");
      return false;
    }
    if (isCompletion) setCompletionTimeError("");
    else setEstimatedTimeError("");
    return true;
  };

  const fetchSprints = async () => {
    const res = await api.get("/api/sprints");
    setSprints(res.data || []);
  };

  const fetchSprintItems = async (sprintName) => {
    if (!sprintName) {
      setSprintBacklog([]);
      return;
    }
    const res = await api.get(`/api/sprints/${encodeURIComponent(sprintName)}/items`);

    // Normalize id so UI uses item.id consistently
    const normalized = (res.data || []).map((it) => ({
      ...it,
      id: it.clientId || it.id || it._id,
    }));

    setSprintBacklog(normalized);
  };

  /* ============================
     Initial load: sprints
  ============================ */
  useEffect(() => {
    (async () => {
      try {
        await fetchSprints();
      } catch (err) {
        console.error("❌ Failed to load sprints:", err);
        alert("Failed to load sprints from server.");
      }
    })();
  }, []);

  /* ============================
     Load sprint backlog when sprint changes
  ============================ */
  useEffect(() => {
    (async () => {
      try {
        await fetchSprintItems(currentSprint.name);
      } catch (err) {
        console.error("❌ Failed to load sprint backlog:", err);
        alert("Failed to load sprint backlog from server.");
      }
    })();
  }, [currentSprint.name]);

  /* ============================
     Sprint CRUD (MongoDB)
  ============================ */
  const handleFieldChange = (field, value) => {
    setCurrentSprint((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSprint = async () => {
    try {
      if (!currentSprint.name) {
        alert("Sprint name is required.");
        return;
      }

      if (!ALLOWED_SPRINT_NAMES.includes(currentSprint.name)) {
        alert("Invalid sprint name. Please select one from Sprint 1/2/3.");
        return;
      }

      if (currentSprint.startDate && currentSprint.endDate) {
        if (new Date(currentSprint.startDate) > new Date(currentSprint.endDate)) {
          alert("Start date cannot be after end date.");
          return;
        }
      }

      // UPSERT via backend (PUT)
      await api.put(`/api/sprints/${encodeURIComponent(currentSprint.name)}`, {
        startDate: currentSprint.startDate,
        endDate: currentSprint.endDate,
        progress: currentSprint.progress,
      });

      await fetchSprints();
      alert("✅ Sprint saved to database!");
    } catch (err) {
      console.error("❌ Save sprint failed:", err);
      alert(
        `Save sprint failed: ${
          err?.response?.data?.message || err?.message || "Server error"
        }`
      );
    }
  };

  const handleEditSprint = async (sprintName) => {
    try {
      const res = await api.get(`/api/sprints/${encodeURIComponent(sprintName)}`);
      setCurrentSprint(res.data);
    } catch (err) {
      console.error("❌ Load sprint failed:", err);
      alert("Failed to load sprint details.");
    }
  };

  const handleDeleteSprint = async (sprintName) => {
    try {
      const ok = window.confirm(`Delete ${sprintName}?`);
      if (!ok) return;

      await api.delete(`/api/sprints/${encodeURIComponent(sprintName)}`);
      await fetchSprints();

      // If deleting the currently selected sprint, clear selection + items
      if (currentSprint.name === sprintName) {
        setCurrentSprint({ name: "", startDate: "", endDate: "", progress: "Not Started" });
        setSprintBacklog([]);
      }

      alert("✅ Sprint deleted.");
    } catch (err) {
      console.error("❌ Delete sprint failed:", err);
      alert("Failed to delete sprint.");
    }
  };

  /* ============================
     Sprint Backlog (MongoDB)
  ============================ */

  // Update a backlog item in DB (status / times / move back to product backlog)
  const updateBacklogItem = async (clientId, patch) => {
    const res = await api.put(`/api/backlog/${encodeURIComponent(clientId)}`, patch);
    return res.data;
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      // If marking completed, ask for completion date within sprint date range
      if (newStatus === "Completed") {
        const sprint = sprints.find((s) => s.name === currentSprint.name);
        if (!sprint?.startDate || !sprint?.endDate) {
          alert("Please set sprint start and end dates before completing tasks.");
          return;
        }

        const completionDate = prompt("Enter completion date (YYYY-MM-DD):");
        if (!completionDate) {
          alert("Completion date is required.");
          return;
        }

        const date = new Date(completionDate);
        const start = new Date(sprint.startDate);
        const end = new Date(sprint.endDate);

        if (Number.isNaN(date.getTime())) {
          alert("Invalid date format.");
          return;
        }
        if (date < start || date > end) {
          alert("Completion date must be within the sprint start and end dates.");
          return;
        }

        const updated = await updateBacklogItem(id, {
          status: "Completed",
          completed: true,
          completionDate, // requires backend field
        });

        setSprintBacklog((prev) =>
          prev.map((it) =>
            it.id === id ? { ...it, ...updated, id: updated.clientId || updated._id || it.id } : it
          )
        );
        return;
      }

      // Non-completed statuses
      const updated = await updateBacklogItem(id, {
        status: newStatus,
        completed: false,
        completionDate: "", // requires backend field
      });

      setSprintBacklog((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, ...updated, id: updated.clientId || updated._id || it.id } : it
        )
      );
    } catch (err) {
      console.error("❌ Status update failed:", err);
      alert("Failed to update status.");
    }
  };

  const handleMoveBackToProductBacklog = async (item) => {
    try {
      // Move out of sprint => sprintName null + reset status
      await updateBacklogItem(item.id, {
        sprintName: null,
        status: "Awaiting Action",
        completed: false,
        completionDate: "",
        completionTime: "",
        estimatedTime: "",
      });

      // Refresh sprint backlog list from server
      await fetchSprintItems(currentSprint.name);

      alert("✅ Moved back to Product Backlog (saved to DB).");
    } catch (err) {
      console.error("❌ Move back failed:", err);
      alert("Failed to move item back to product backlog.");
    }
  };

  // This is called by ProductBacklog after it transfers to sprint.
  // We just refresh from server so DB is the single source of truth.
  const handleAddToSprintBacklog = async (_item, sprintName) => {
    try {
      await fetchSprintItems(sprintName);
    } catch (err) {
      console.error("❌ Refresh sprint backlog failed:", err);
    }
  };

  // Save estimatedTime/completionTime edits (onBlur)
  const handleTimeChangeLocal = (id, field, value) => {
    setSprintBacklog((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  const handleTimeSave = async (id, field, value) => {
    try {
      const isCompletion = field === "completionTime";
      const ok = validateTimeFormat(value || "", isCompletion);
      if (!ok) return;

      const updated = await updateBacklogItem(id, { [field]: value }); // requires backend field

      setSprintBacklog((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, ...updated, id: updated.clientId || updated._id || it.id } : it
        )
      );
    } catch (err) {
      console.error("❌ Save time failed:", err);
      alert("Failed to save time field to DB.");
    }
  };

  /* ============================
     Sorting
  ============================ */
  const sortedSprints = useMemo(() => {
    const list = [...sprints];
    list.sort((a, b) => {
      if (sprintSortCriteria === "name") {
        return sprintSortOrder === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      if (sprintSortCriteria === "startDate") {
        return sprintSortOrder === "asc"
          ? new Date(a.startDate) - new Date(b.startDate)
          : new Date(b.startDate) - new Date(a.startDate);
      }
      if (sprintSortCriteria === "endDate") {
        return sprintSortOrder === "asc"
          ? new Date(a.endDate) - new Date(b.endDate)
          : new Date(b.endDate) - new Date(a.endDate);
      }
      return 0;
    });
    return list;
  }, [sprints, sprintSortCriteria, sprintSortOrder]);

  const sortedSprintBacklog = useMemo(() => {
    const list = [...sprintBacklog];
    list.sort((a, b) => {
      if (backlogSortCriteria === "developer") {
        const A = (a.developer || "").toLowerCase();
        const B = (b.developer || "").toLowerCase();
        return backlogSortDeveloperOrder === "asc" ? A.localeCompare(B) : B.localeCompare(A);
      }

      const A = (a[backlogSortCriteria] || "").toString().toLowerCase();
      const B = (b[backlogSortCriteria] || "").toString().toLowerCase();
      return backlogSortOrder === "asc" ? A.localeCompare(B) : B.localeCompare(A);
    });
    return list;
  }, [sprintBacklog, backlogSortCriteria, backlogSortOrder, backlogSortDeveloperOrder]);

  /* ============================
     Render
  ============================ */
  return (
    <div className={`sprint-page theme-${theme}`}>
      <h1>Sprint - 1</h1>

      {/* Sprint Details */}
      <div className="sprint-details">
        <div className="field-group">
          <label>Sprint Name: </label>
          <select
            value={currentSprint.name}
            onChange={(e) => handleFieldChange("name", e.target.value)}
          >
            <option value="">-- Select Sprint Name --</option>
            {ALLOWED_SPRINT_NAMES.map((name) => (
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
            value={currentSprint.startDate || ""}
            onChange={(e) => handleFieldChange("startDate", e.target.value)}
          />
        </div>

        <div className="field-group">
          <label>End Date: </label>
          <input
            type="date"
            value={currentSprint.endDate || ""}
            onChange={(e) => handleFieldChange("endDate", e.target.value)}
          />
        </div>

        <div className="field-group">
          <label>Progress: </label>
          <select
            value={currentSprint.progress || "Not Started"}
            onChange={(e) => handleFieldChange("progress", e.target.value)}
          >
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <button onClick={handleSaveSprint}>Save Sprint</button>
      </div>

      {/* Sprints List */}
      <div className="sprint-list">
        <h2>Sprints</h2>

        <div className="sort-controls">
          <label>Sort by:</label>
          <select value={sprintSortCriteria} onChange={(e) => setSprintSortCriteria(e.target.value)}>
            <option value="name">Name</option>
            <option value="startDate">Start Date</option>
            <option value="endDate">End Date</option>
          </select>

          <label>Order:</label>
          <select value={sprintSortOrder} onChange={(e) => setSprintSortOrder(e.target.value)}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        {sortedSprints.length === 0 ? (
          <p>No sprints available.</p>
        ) : (
          <ul>
            {sortedSprints.map((sprint) => (
              <li key={sprint.name} className="sprint-item">
                <div><strong>Name:</strong> {sprint.name}</div>
                <div><strong>Start Date:</strong> {sprint.startDate || "-"}</div>
                <div><strong>End Date:</strong> {sprint.endDate || "-"}</div>
                <div><strong>Progress:</strong> {sprint.progress || "-"}</div>

                {sprint.name === "Sprint 1" && (
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

      {/* Sprint Backlog */}
      <div className="backlog-section">
        <h2>Sprint Backlog for {currentSprint.name || "Select a Sprint"}</h2>

        <div className="sort-controls">
          <label>Sort by:</label>
          <select value={backlogSortCriteria} onChange={(e) => setBacklogSortCriteria(e.target.value)}>
            <option value="title">Title</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
            <option value="developer">Developer</option>
          </select>

          <label>Order:</label>
          <select value={backlogSortOrder} onChange={(e) => setBacklogSortOrder(e.target.value)}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>

          <label>Developer Order:</label>
          <select
            value={backlogSortDeveloperOrder}
            onChange={(e) => setBacklogSortDeveloperOrder(e.target.value)}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        {!currentSprint.name ? (
          <p>Please select a sprint.</p>
        ) : sortedSprintBacklog.length === 0 ? (
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
                  <td>{item.title}</td>
                  <td>{item.priority}</td>

                  <td>
                    <select
                      value={item.completed ? "Completed" : item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                    >
                      <option value="Awaiting Action">Awaiting Action</option>
                      <option value="Under Development">Under Development</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>

                  <td>{item.developer}</td>

                  <td>
                    {item.status === "Awaiting Action" && (
                      <>
                        <input
                          type="text"
                          placeholder="2w 4d 6h 45m"
                          value={item.estimatedTime || ""}
                          onChange={(e) => handleTimeChangeLocal(item.id, "estimatedTime", e.target.value)}
                          onBlur={(e) => handleTimeSave(item.id, "estimatedTime", e.target.value)}
                        />
                        {estimatedTimeError && <span className="error-message">{estimatedTimeError}</span>}
                      </>
                    )}
                  </td>

                  <td>
                    {item.status === "Completed" && (
                      <>
                        <input
                          type="text"
                          placeholder="2w 4d 6h 45m"
                          value={item.completionTime || ""}
                          onChange={(e) => handleTimeChangeLocal(item.id, "completionTime", e.target.value)}
                          onBlur={(e) => handleTimeSave(item.id, "completionTime", e.target.value)}
                        />
                        {completionTimeError && <span className="error-message">{completionTimeError}</span>}
                      </>
                    )}
                  </td>

                  <td>{item.status === "Completed" ? item.completionDate || "--" : "--"}</td>

                  <td>
                    {item.status === "Awaiting Action" && (
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

      {/* Product Backlog (already DB-based in your updated version) */}
      <ProductBacklog sprints={sprints} onAddToSprintBacklog={handleAddToSprintBacklog} />
    </div>
  );
};

export default Sprint2;