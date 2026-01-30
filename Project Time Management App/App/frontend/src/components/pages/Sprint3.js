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

const Sprint1 = () => {
  const { theme } = useContext(ThemeContext);

  /* ============================
     DB-backed state (NO localStorage)
  ============================ */
  const [sprints, setSprints] = useState([]);

  // ✅ user selects an existing sprint to view/edit backlog
  const [selectedSprintName, setSelectedSprintName] = useState("");

  // ✅ separate state just for creating/upserting sprint metadata
  const [draftSprint, setDraftSprint] = useState({
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
     Load sprint backlog when selected sprint changes
  ============================ */
  useEffect(() => {
    (async () => {
      try {
        await fetchSprintItems(selectedSprintName);
      } catch (err) {
        console.error("❌ Failed to load sprint backlog:", err);
        alert("Failed to load sprint backlog from server.");
      }
    })();
  }, [selectedSprintName]);

  /* ============================
     Sprint CRUD (MongoDB)
  ============================ */
  const handleDraftChange = (field, value) => {
    setDraftSprint((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSprint = async () => {
    try {
      if (!draftSprint.name) {
        alert("Sprint name is required.");
        return;
      }

      if (!ALLOWED_SPRINT_NAMES.includes(draftSprint.name)) {
        alert("Invalid sprint name. Please select one from Sprint 1/2/3.");
        return;
      }

      if (draftSprint.startDate && draftSprint.endDate) {
        if (new Date(draftSprint.startDate) > new Date(draftSprint.endDate)) {
          alert("Start date cannot be after end date.");
          return;
        }
      }

      // UPSERT via backend (PUT)
      await api.put(`/api/sprints/${encodeURIComponent(draftSprint.name)}`, {
        startDate: draftSprint.startDate,
        endDate: draftSprint.endDate,
        progress: draftSprint.progress,
      });

      await fetchSprints();

      // ✅ after creating, auto-select it so backlog view works
      setSelectedSprintName(draftSprint.name);

      alert("✅ Sprint saved to database!");
    } catch (err) {
      console.error("❌ Save sprint failed:", err);
      alert(`Save sprint failed: ${err?.response?.data?.message || err?.message || "Server error"}`);
    }
  };

  const handleEditSprint = async (sprintName) => {
    try {
      const res = await api.get(`/api/sprints/${encodeURIComponent(sprintName)}`);

      // load into draft editor
      setDraftSprint({
        name: res.data?.name || sprintName,
        startDate: res.data?.startDate || "",
        endDate: res.data?.endDate || "",
        progress: res.data?.progress || "Not Started",
      });

      // also select it for backlog view
      setSelectedSprintName(sprintName);
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

      if (selectedSprintName === sprintName) {
        setSelectedSprintName("");
        setSprintBacklog([]);
      }

      // reset editor if deleting the one you were editing
      if (draftSprint.name === sprintName) {
        setDraftSprint({ name: "", startDate: "", endDate: "", progress: "Not Started" });
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
  const updateBacklogItem = async (clientId, patch) => {
    const res = await api.put(`/api/backlog/${encodeURIComponent(clientId)}`, patch);
    return res.data;
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      if (!selectedSprintName) {
        alert("Please select a sprint first.");
        return;
      }

      if (newStatus === "Completed") {
        const sprint = sprints.find((s) => s.name === selectedSprintName);
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
          completionDate,
        });

        setSprintBacklog((prev) =>
          prev.map((it) =>
            it.id === id ? { ...it, ...updated, id: updated.clientId || updated._id || it.id } : it
          )
        );
        return;
      }

      const updated = await updateBacklogItem(id, {
        status: newStatus,
        completed: false,
        completionDate: "",
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
      await updateBacklogItem(item.id, {
        sprintName: null,
        status: "Awaiting Action",
        completed: false,
        completionDate: "",
        completionTime: "",
        estimatedTime: "",
      });

      await fetchSprintItems(selectedSprintName);
      alert("✅ Moved back to Product Backlog (saved to DB).");
    } catch (err) {
      console.error("❌ Move back failed:", err);
      alert("Failed to move item back to product backlog.");
    }
  };

  const handleAddToSprintBacklog = async (_item, sprintName) => {
    try {
      // refresh current view if adding to selected sprint
      if (sprintName === selectedSprintName) {
        await fetchSprintItems(sprintName);
      }
    } catch (err) {
      console.error("❌ Refresh sprint backlog failed:", err);
    }
  };

  const handleTimeChangeLocal = (id, field, value) => {
    setSprintBacklog((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };

  const handleTimeSave = async (id, field, value) => {
    try {
      const isCompletion = field === "completionTime";
      const ok = validateTimeFormat(value || "", isCompletion);
      if (!ok) return;

      const updated = await updateBacklogItem(id, { [field]: value });

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
        return sprintSortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
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

      {/* ============================
          CREATE / EDIT SPRINT (does NOT show uncreated sprints)
      ============================ */}
      <div className="sprint-details">
        <h2>Create / Edit Sprint</h2>

        <div className="field-group">
          <label>Sprint Name: </label>
          {/* ✅ This is ONLY for creation/editing, not for viewing backlog */}
          <select value={draftSprint.name} onChange={(e) => handleDraftChange("name", e.target.value)}>
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
            value={draftSprint.startDate || ""}
            onChange={(e) => handleDraftChange("startDate", e.target.value)}
          />
        </div>

        <div className="field-group">
          <label>End Date: </label>
          <input
            type="date"
            value={draftSprint.endDate || ""}
            onChange={(e) => handleDraftChange("endDate", e.target.value)}
          />
        </div>

        <div className="field-group">
          <label>Progress: </label>
          <select
            value={draftSprint.progress || "Not Started"}
            onChange={(e) => handleDraftChange("progress", e.target.value)}
          >
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <button onClick={handleSaveSprint}>Save Sprint</button>
      </div>

      {/* ============================
          SPRINT LIST (only DB sprints)
      ============================ */}
      <div className="sprint-list">
        <h2>Created Sprints</h2>

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
          <p>No sprints available. Create one above.</p>
        ) : (
          <ul>
            {sortedSprints.map((sprint) => (
              <li key={sprint.name} className="sprint-item">
                <div><strong>Name:</strong> {sprint.name}</div>
                <div><strong>Start Date:</strong> {sprint.startDate || "-"}</div>
                <div><strong>End Date:</strong> {sprint.endDate || "-"}</div>
                <div><strong>Progress:</strong> {sprint.progress || "-"}</div>

                {/* ✅ Select to view backlog */}
                <button onClick={() => setSelectedSprintName(sprint.name)}>
                  View Backlog
                </button>

                {/* Keep your Sprint 1-only edit/delete rule if you want */}
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

      {/* ============================
          SELECT SPRINT (only created sprints)
      ============================ */}
      <div className="sprint-details">
        <h2>Select Sprint to View Backlog</h2>
        <div className="field-group">
          <label>Sprint: </label>
          <select
            value={selectedSprintName}
            onChange={(e) => setSelectedSprintName(e.target.value)}
          >
            <option value="">-- Select Created Sprint --</option>
            {sprints.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ============================
          SPRINT BACKLOG
      ============================ */}
      <div className="backlog-section">
        <h2>Sprint Backlog for {selectedSprintName || "Select a Sprint"}</h2>

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

        {!selectedSprintName ? (
          <p>Please select a created sprint.</p>
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

      {/* Product Backlog - receives ONLY created sprints (DB) */}
      <ProductBacklog sprints={sprints} onAddToSprintBacklog={handleAddToSprintBacklog} />
    </div>
  );
};

export default Sprint1;