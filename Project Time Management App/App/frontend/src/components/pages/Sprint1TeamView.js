import React, { useEffect, useMemo, useState, useContext } from "react";
import ProductBacklog from "./ProductBacklogTeamView";
import "./SprintPage.css";
import { ThemeContext } from "../../contexts/theme-context";
import { api } from "../../api";

const FIXED_SPRINT_NAME = "Sprint 1";

// Regex for "2w 4d 6h 45m"
const timeFormatRegex = /^(\d+w\s*)?(\d+d\s*)?(\d+h\s*)?(\d+m\s*)?$/;

const Sprint1TeamView = () => {
  const { theme } = useContext(ThemeContext);

  const [sprints, setSprints] = useState([]);

  const [currentSprint, setCurrentSprint] = useState({
    name: "",
    startDate: "",
    endDate: "",
    progress: "Not Started",
  });

  const [sprintBacklog, setSprintBacklog] = useState([]);

  // sorting
  const [backlogSortCriteria, setBacklogSortCriteria] = useState("title");
  const [backlogSortOrder, setBacklogSortOrder] = useState("asc");
  const [backlogSortDeveloperOrder, setBacklogSortDeveloperOrder] = useState("asc");

  // errors for time inputs
  const [estimatedTimeError, setEstimatedTimeError] = useState("");
  const [completionTimeError, setCompletionTimeError] = useState("");

  /* ============================
     Load sprints
  ============================ */
  useEffect(() => {
    const loadSprints = async () => {
      try {
        const res = await api.get("/api/sprints");
        setSprints(res.data || []);
      } catch (err) {
        console.error("❌ Failed to load sprints:", err);
        alert("Failed to load sprints from server.");
      }
    };
    loadSprints();
  }, []);

  /* ============================
     Load sprint details + items on sprint change
  ============================ */
  useEffect(() => {
    if (!currentSprint.name) {
      setSprintBacklog([]);
      setCurrentSprint((prev) => ({
        ...prev,
        startDate: "",
        endDate: "",
        progress: "Not Started",
      }));
      return;
    }

    const loadSprint = async () => {
      try {
        // sprint details
        const sprintRes = await api.get(`/api/sprints/${encodeURIComponent(currentSprint.name)}`);

        setCurrentSprint((prev) => ({
          ...prev,
          startDate: sprintRes.data?.startDate || "",
          endDate: sprintRes.data?.endDate || "",
          progress: sprintRes.data?.progress || "Not Started",
        }));

        // sprint items
        const res = await api.get(
          `/api/sprints/${encodeURIComponent(currentSprint.name)}/items`
        );

        const normalized = (res.data || []).map((it) => ({
          ...it,
          id: it.clientId || it._id || it.id,
          estimatedTime: it.estimatedTime || "",
          completionTime: it.completionTime || "",
          completionDate: it.completionDate || "",
        }));

        setSprintBacklog(normalized);
      } catch (err) {
        console.error("❌ Failed to load sprint data:", err);
        alert("Failed to load sprint data.");
      }
    };

    loadSprint();
  }, [currentSprint.name]);

  /* ============================
     Helpers
  ============================ */
  const handleFieldChange = (field, value) => {
    setCurrentSprint((prev) => ({ ...prev, [field]: value }));
  };

  const validateTimeFormat = (time, isCompletion = false) => {
    const ok = timeFormatRegex.test(time || "");
    if (!ok) {
      if (isCompletion) setCompletionTimeError("Invalid format! Use: 2w 4d 6h 45m");
      else setEstimatedTimeError("Invalid format! Use: 2w 4d 6h 45m");
      return false;
    }
    if (isCompletion) setCompletionTimeError("");
    else setEstimatedTimeError("");
    return true;
  };

  const updateBacklogItem = async (id, patch) => {
    const res = await api.put(`/api/backlog/${encodeURIComponent(id)}`, patch);
    return res.data;
  };

  /* ============================
     Status Change (Team can change)
  ============================ */
  const handleStatusChange = async (id, newStatus) => {
    try {
      // If marking Completed -> ask completion date within sprint date range
      if (newStatus === "Completed") {
        if (!currentSprint.startDate || !currentSprint.endDate) {
          alert("Sprint start/end dates must be set before completing tasks.");
          return;
        }

        const completionDate = prompt("Enter completion date (YYYY-MM-DD):");
        if (!completionDate) {
          alert("Completion date is required.");
          return;
        }

        const date = new Date(completionDate);
        const start = new Date(currentSprint.startDate);
        const end = new Date(currentSprint.endDate);

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
          prev.map((it) => (it.id === id ? { ...it, ...updated } : it))
        );
        return;
      }

      // moving away from Completed -> clear completion fields
      const updated = await updateBacklogItem(id, {
        status: newStatus,
        completed: false,
        completionDate: "",
        completionTime: "",
      });

      setSprintBacklog((prev) =>
        prev.map((it) => (it.id === id ? { ...it, ...updated } : it))
      );
    } catch (err) {
      console.error("❌ Status update failed:", err);
      alert("Failed to update status.");
    }
  };

  /* ============================
     Editable time fields
  ============================ */
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
        prev.map((it) => (it.id === id ? { ...it, ...updated } : it))
      );
    } catch (err) {
      console.error("❌ Save time failed:", err);
      alert("Failed to save time.");
    }
  };

  const handleCompletionDateSave = async (id, completionDate) => {
    try {
      if (!currentSprint.startDate || !currentSprint.endDate) {
        alert("Sprint start/end dates must be set first.");
        return;
      }

      const date = new Date(completionDate);
      const start = new Date(currentSprint.startDate);
      const end = new Date(currentSprint.endDate);

      if (Number.isNaN(date.getTime())) {
        alert("Invalid date format.");
        return;
      }
      if (date < start || date > end) {
        alert("Completion date must be within the sprint start and end dates.");
        return;
      }

      const updated = await updateBacklogItem(id, { completionDate });

      setSprintBacklog((prev) =>
        prev.map((it) => (it.id === id ? { ...it, ...updated } : it))
      );
    } catch (err) {
      console.error("❌ Save completion date failed:", err);
      alert("Failed to save completion date.");
    }
  };

  /* ============================
     Refresh after add from PB Team View
  ============================ */
  const handleAddToSprintBacklog = async (_item, sprintName) => {
    if (!sprintName || sprintName !== currentSprint.name) return;

    try {
      const res = await api.get(`/api/sprints/${encodeURIComponent(sprintName)}/items`);
      setSprintBacklog(
        (res.data || []).map((it) => ({
          ...it,
          id: it.clientId || it._id || it.id,
          estimatedTime: it.estimatedTime || "",
          completionTime: it.completionTime || "",
          completionDate: it.completionDate || "",
        }))
      );
    } catch (err) {
      console.error("❌ Refresh sprint items failed:", err);
    }
  };

  /* ============================
     Sorting
  ============================ */
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
      <h1>Sprint – Team View</h1>

      {/* Sprint Details (read-only like SM but no save/delete) */}
      <div className="sprint-details">
        <div className="field-group">
          <label>Sprint Name:</label>
          <select value={currentSprint.name} onChange={(e) => handleFieldChange("name", e.target.value)}>
            <option value="">Select Sprint</option>
            {FIXED_SPRINT_NAME .map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label>Start Date:</label>
          <input type="date" value={currentSprint.startDate || ""} disabled />
        </div>

        <div className="field-group">
          <label>End Date:</label>
          <input type="date" value={currentSprint.endDate || ""} disabled />
        </div>

        <div className="field-group">
          <label>Progress:</label>
          <input value={currentSprint.progress || "Not Started"} disabled />
        </div>
      </div>

      {/* Backlog */}
      <div className="backlog-section">
        <h2>Sprint Backlog</h2>

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
          <p>No sprint items</p>
        ) : (
          <div className="table-scroll">
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

                    {/* Estimated Time (editable only when Awaiting Action) */}
                    <td>
                      {item.status === "Awaiting Action" ? (
                        <>
                          <input
                            type="text"
                            placeholder="2w 4d 6h 45m"
                            value={item.estimatedTime || ""}
                            onChange={(e) =>
                              handleTimeChangeLocal(item.id, "estimatedTime", e.target.value)
                            }
                            onBlur={(e) => handleTimeSave(item.id, "estimatedTime", e.target.value)}
                          />
                          {estimatedTimeError && (
                            <span className="error-message">{estimatedTimeError}</span>
                          )}
                        </>
                      ) : (
                        item.estimatedTime || "-"
                      )}
                    </td>

                    {/* Completion Time (editable only when Completed) */}
                    <td>
                      {item.status === "Completed" ? (
                        <>
                          <input
                            type="text"
                            placeholder="2w 4d 6h 45m"
                            value={item.completionTime || ""}
                            onChange={(e) =>
                              handleTimeChangeLocal(item.id, "completionTime", e.target.value)
                            }
                            onBlur={(e) =>
                              handleTimeSave(item.id, "completionTime", e.target.value)
                            }
                          />
                          {completionTimeError && (
                            <span className="error-message">{completionTimeError}</span>
                          )}
                        </>
                      ) : (
                        item.completionTime || "-"
                      )}
                    </td>

                    {/* Completion Date (editable only when Completed) */}
                    <td>
                      {item.status === "Completed" ? (
                        <input
                          type="date"
                          value={item.completionDate || ""}
                          onChange={(e) =>
                            handleTimeChangeLocal(item.id, "completionDate", e.target.value)
                          }
                          onBlur={(e) => handleCompletionDateSave(item.id, e.target.value)}
                        />
                      ) : (
                        "--"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ProductBacklog sprints={sprints} onAddToSprintBacklog={handleAddToSprintBacklog} />
    </div>
  );
};

export default Sprint1TeamView;