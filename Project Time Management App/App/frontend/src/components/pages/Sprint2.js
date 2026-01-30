// src/components/pages/Sprint2.js
import React, { useEffect, useMemo, useState, useContext } from "react";
import ProductBacklog from "./ProductBacklog";
import "./SprintPage.css";
import { ThemeContext } from "../../contexts/theme-context";
import { api } from "../../api";

const FIXED_SPRINT_NAME = "Sprint 2";

// Regex for "2w 4d 6h 45m"
const timeFormatRegex = /^(\d+w\s*)?(\d+d\s*)?(\d+h\s*)?(\d+m\s*)?$/;

const Sprint2 = () => {
  const { theme } = useContext(ThemeContext);

  const [sprints, setSprints] = useState([]);

  const [currentSprint, setCurrentSprint] = useState({
    name: FIXED_SPRINT_NAME,
    startDate: "",
    endDate: "",
    progress: "Not Started",
  });

  const [sprintExists, setSprintExists] = useState(false);
  const [loadingSprint, setLoadingSprint] = useState(true);

  const [sprintBacklog, setSprintBacklog] = useState([]);

  const [backlogSortCriteria, setBacklogSortCriteria] = useState("title");
  const [backlogSortOrder, setBacklogSortOrder] = useState("asc");
  const [backlogSortDeveloperOrder, setBacklogSortDeveloperOrder] = useState("asc");

  const [estimatedTimeError, setEstimatedTimeError] = useState("");
  const [completionTimeError, setCompletionTimeError] = useState("");

  const validateTimeFormat = (time, isCompletion = false) => {
    if (!timeFormatRegex.test(time)) {
      if (isCompletion) setCompletionTimeError("Invalid format! Use: 2w 4d 6h 45m");
      else setEstimatedTimeError("Invalid format! Use: 2w 4d 6h 45m");
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

  const fetchSprint = async () => {
    setLoadingSprint(true);
    try {
      const res = await api.get(`/api/sprints/${encodeURIComponent(FIXED_SPRINT_NAME)}`);
      setCurrentSprint({
        name: FIXED_SPRINT_NAME,
        startDate: res.data?.startDate || "",
        endDate: res.data?.endDate || "",
        progress: res.data?.progress || "Not Started",
      });
      setSprintExists(true);
    } catch (err) {
      if (err?.response?.status === 404) {
        setSprintExists(false);
        setCurrentSprint({
          name: FIXED_SPRINT_NAME,
          startDate: "",
          endDate: "",
          progress: "Not Started",
        });
        setSprintBacklog([]);
      } else {
        console.error(`❌ Failed to load ${FIXED_SPRINT_NAME}:`, err);
        alert(`Failed to load ${FIXED_SPRINT_NAME} from server.`);
      }
    } finally {
      setLoadingSprint(false);
    }
  };

  const fetchSprintItems = async () => {
    if (!sprintExists) {
      setSprintBacklog([]);
      return;
    }
    const res = await api.get(`/api/sprints/${encodeURIComponent(FIXED_SPRINT_NAME)}/items`);
    const normalized = (res.data || []).map((it) => ({
      ...it,
      id: it.clientId || it.id || it._id,
      sprint: it.sprintName || FIXED_SPRINT_NAME,
    }));
    setSprintBacklog(normalized);
  };

  useEffect(() => {
    (async () => {
      await fetchSprints();
      await fetchSprint();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      if (!loadingSprint) {
        await fetchSprintItems();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sprintExists, loadingSprint]);

  const handleFieldChange = (field, value) => {
    setCurrentSprint((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSprint = async () => {
    try {
      if (currentSprint.startDate && currentSprint.endDate) {
        if (new Date(currentSprint.startDate) > new Date(currentSprint.endDate)) {
          alert("Start date cannot be after end date.");
          return;
        }
      }

      await api.put(`/api/sprints/${encodeURIComponent(FIXED_SPRINT_NAME)}`, {
        startDate: currentSprint.startDate,
        endDate: currentSprint.endDate,
        progress: currentSprint.progress,
      });

      await fetchSprints();
      await fetchSprint();
      alert(`✅ ${sprintExists ? "Sprint updated!" : "Sprint created!"}`);
    } catch (err) {
      console.error("❌ Save sprint failed:", err);
      alert(err?.response?.data?.message || "Save sprint failed");
    }
  };

  const handleDeleteSprint = async () => {
    try {
      const ok = window.confirm(`Delete ${FIXED_SPRINT_NAME}?`);
      if (!ok) return;

      await api.delete(`/api/sprints/${encodeURIComponent(FIXED_SPRINT_NAME)}`);
      await fetchSprints();
      await fetchSprint();
      alert("✅ Sprint deleted.");
    } catch (err) {
      console.error("❌ Delete sprint failed:", err);
      alert("Failed to delete sprint.");
    }
  };

  const updateBacklogItem = async (id, patch) => {
    const res = await api.put(`/api/backlog/${encodeURIComponent(id)}`, patch);
    return res.data;
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      if (newStatus === "Completed") {
        if (!currentSprint.startDate || !currentSprint.endDate) {
          alert(`Set ${FIXED_SPRINT_NAME} start/end dates before completing tasks.`);
          return;
        }

        const completionDate = prompt("Enter completion date (YYYY-MM-DD):");
        if (!completionDate) return;

        const date = new Date(completionDate);
        const start = new Date(currentSprint.startDate);
        const end = new Date(currentSprint.endDate);

        if (Number.isNaN(date.getTime())) {
          alert("Invalid date format.");
          return;
        }
        if (date < start || date > end) {
          alert("Completion date must be within sprint start/end.");
          return;
        }

        await updateBacklogItem(id, {
          status: "Completed",
          completed: true,
          completionDate,
        });
      } else {
        await updateBacklogItem(id, {
          status: newStatus,
          completed: false,
          completionDate: "",
        });
      }

      await fetchSprintItems();
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

      await fetchSprintItems();
      alert("✅ Moved back to Product Backlog.");
    } catch (err) {
      console.error("❌ Move back failed:", err);
      alert("Failed to move back.");
    }
  };

  const handleTimeChangeLocal = (id, field, value) => {
    setSprintBacklog((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };

  const handleTimeSave = async (id, field, value) => {
    try {
      const ok = validateTimeFormat(value || "", field === "completionTime");
      if (!ok) return;

      await updateBacklogItem(id, { [field]: value });
      await fetchSprintItems();
    } catch (err) {
      console.error("❌ Save time failed:", err);
      alert("Failed to save time.");
    }
  };

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

  return (
    <div className={`sprint-page theme-${theme}`}>
      <h1>{FIXED_SPRINT_NAME}</h1>

      <div className="sprint-details">
        <div className="field-group">
          <label>Sprint Name: </label>
          <input value={FIXED_SPRINT_NAME} disabled />
        </div>

        <div className="field-group">
          <label>Start Date: </label>
          <input
            type="date"
            value={currentSprint.startDate || ""}
            onChange={(e) => handleFieldChange("startDate", e.target.value)}
            disabled={loadingSprint}
          />
        </div>

        <div className="field-group">
          <label>End Date: </label>
          <input
            type="date"
            value={currentSprint.endDate || ""}
            onChange={(e) => handleFieldChange("endDate", e.target.value)}
            disabled={loadingSprint}
          />
        </div>

        <div className="field-group">
          <label>Progress: </label>
          <select
            value={currentSprint.progress || "Not Started"}
            onChange={(e) => handleFieldChange("progress", e.target.value)}
            disabled={loadingSprint}
          >
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {loadingSprint ? (
          <p>Loading...</p>
        ) : (
          <>
            <button onClick={handleSaveSprint}>
              {sprintExists ? "Update Sprint" : "Create Sprint"}
            </button>

            {sprintExists && (
              <button onClick={handleDeleteSprint} style={{ marginLeft: 10 }}>
                Delete Sprint
              </button>
            )}
          </>
        )}
      </div>

      {loadingSprint ? null : !sprintExists ? (
        <div className="backlog-section">
          <h2>Sprint Backlog</h2>
          <p style={{ color: "crimson" }}>
            Sprint 2 is not created yet. Please set dates and click <b>Create Sprint</b> first.
          </p>
        </div>
      ) : (
        <div className="backlog-section">
          <h2>Sprint Backlog for {FIXED_SPRINT_NAME}</h2>

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

          {sortedSprintBacklog.length === 0 ? (
            <p>No items in Sprint 2 backlog</p>
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
      )}

      <ProductBacklog
        sprints={sprints}
        fixedSprintName={FIXED_SPRINT_NAME}
        sprintExists={sprintExists}
        onAddToSprintBacklog={async () => {
          await fetchSprintItems();
        }}
      />
    </div>
  );
};

export default Sprint2;