// src/components/pages/Sprint1.js
import React, { useState, useEffect, useContext, useMemo } from "react";
import ProductBacklog from "./ProductBacklogTeamView";
import "./SprintPage.css";
import { ThemeContext } from "../../contexts/theme-context";
import { api } from "../../api";

const ALLOWED_SPRINT_NAMES = ["Sprint 1", "Sprint 2", "Sprint 3"];
const timeFormatRegex = /^(\d+w\s*)?(\d+d\s*)?(\d+h\s*)?(\d+m\s*)?$/;

const Sprint1 = () => {
  const { theme } = useContext(ThemeContext);

  /* ============================
     DB-backed state ONLY
  ============================ */
  const [sprints, setSprints] = useState([]);
  const [currentSprint, setCurrentSprint] = useState({
    name: "",
    startDate: "",
    endDate: "",
    progress: "Not Started",
  });

  const [sprintBacklog, setSprintBacklog] = useState([]);

  /* ============================
     Sorting state
  ============================ */
  const [sprintSortCriteria, setSprintSortCriteria] = useState("name");
  const [sprintSortOrder, setSprintSortOrder] = useState("asc");

  const [backlogSortCriteria, setBacklogSortCriteria] = useState("title");
  const [backlogSortOrder, setBacklogSortOrder] = useState("asc");
  const [backlogSortDeveloperOrder, setBacklogSortDeveloperOrder] = useState("asc");

  const [estimatedTimeError, setEstimatedTimeError] = useState("");
  const [completionTimeError, setCompletionTimeError] = useState("");

  /* ============================
     Load sprints from MongoDB
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
     Load sprint backlog when sprint changes
  ============================ */
  useEffect(() => {
    if (!currentSprint.name) {
      setSprintBacklog([]);
      return;
    }

    const loadSprintBacklog = async () => {
      try {
        const res = await api.get(
          `/api/sprints/${encodeURIComponent(currentSprint.name)}/items`
        );

        const normalized = (res.data || []).map((it) => ({
          id: it.clientId || it._id,
          title: it.title,
          priority: it.priority,
          developer: it.developer,
          status: it.status,
          completed: it.completed,
          sprint: it.sprintName,
          estimatedTime: it.estimatedTime || "",
          completionTime: it.completionTime || "",
          completionDate: it.completionDate || "",
        }));

        setSprintBacklog(normalized);
      } catch (err) {
        console.error("❌ Failed to load sprint backlog:", err);
        alert("Failed to load sprint backlog.");
      }
    };

    loadSprintBacklog();
  }, [currentSprint.name]);

  /* ============================
     Sprint CRUD (MongoDB)
  ============================ */
  const handleFieldChange = (field, value) => {
    setCurrentSprint((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSprint = async () => {
    try {
      if (!ALLOWED_SPRINT_NAMES.includes(currentSprint.name)) {
        alert("Invalid sprint name.");
        return;
      }

      if (
        currentSprint.startDate &&
        currentSprint.endDate &&
        new Date(currentSprint.startDate) > new Date(currentSprint.endDate)
      ) {
        alert("Start date cannot be after end date.");
        return;
      }

      await api.put(`/api/sprints/${currentSprint.name}`, {
        startDate: currentSprint.startDate,
        endDate: currentSprint.endDate,
        progress: currentSprint.progress,
      });

      const res = await api.get("/api/sprints");
      setSprints(res.data || []);

      alert("✅ Sprint saved");
    } catch (err) {
      console.error("❌ Save sprint failed:", err);
      alert("Failed to save sprint.");
    }
  };

  /* ============================
     Backlog item helpers
  ============================ */
  const validateTimeFormat = (v, isCompletion = false) => {
    if (!timeFormatRegex.test(v)) {
      isCompletion
        ? setCompletionTimeError("Invalid format")
        : setEstimatedTimeError("Invalid format");
      return false;
    }
    isCompletion ? setCompletionTimeError("") : setEstimatedTimeError("");
    return true;
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const payload = {
        status: newStatus,
        completed: newStatus === "Completed",
      };

      const res = await api.put(`/api/backlog/${id}`, payload);

      setSprintBacklog((prev) =>
        prev.map((x) =>
          x.id === id ? { ...x, status: res.data.status, completed: res.data.completed } : x
        )
      );
    } catch {
      alert("Failed to update status");
    }
  };

  const handleMoveBackToProductBacklog = async (item) => {
    try {
      await api.put(`/api/backlog/${item.id}`, {
        sprintName: null,
        status: "Awaiting Action",
        completed: false,
        estimatedTime: "",
        completionTime: "",
        completionDate: "",
      });

      setSprintBacklog((prev) => prev.filter((x) => x.id !== item.id));
    } catch {
      alert("Failed to move item");
    }
  };

  const handleAddToSprintBacklog = async (_item, sprintName) => {
    if (sprintName === currentSprint.name) {
      const res = await api.get(
        `/api/sprints/${encodeURIComponent(sprintName)}/items`
      );
      setSprintBacklog(
        (res.data || []).map((it) => ({
          id: it.clientId || it._id,
          ...it,
        }))
      );
    }
  };

  /* ============================
     Sorting
  ============================ */
  const sortedSprints = useMemo(() => {
    return [...sprints].sort((a, b) =>
      sprintSortOrder === "asc"
        ? a[sprintSortCriteria]?.localeCompare(b[sprintSortCriteria])
        : b[sprintSortCriteria]?.localeCompare(a[sprintSortCriteria])
    );
  }, [sprints, sprintSortCriteria, sprintSortOrder]);

  const sortedSprintBacklog = useMemo(() => {
    return [...sprintBacklog].sort((a, b) => {
      if (backlogSortCriteria === "developer") {
        return backlogSortDeveloperOrder === "asc"
          ? a.developer.localeCompare(b.developer)
          : b.developer.localeCompare(a.developer);
      }
      return backlogSortOrder === "asc"
        ? a[backlogSortCriteria]?.localeCompare(b[backlogSortCriteria])
        : b[backlogSortCriteria]?.localeCompare(a[backlogSortCriteria]);
    });
  }, [
    sprintBacklog,
    backlogSortCriteria,
    backlogSortOrder,
    backlogSortDeveloperOrder,
  ]);

  /* ============================
     Render
  ============================ */
  return (
    <div className={`sprint-page theme-${theme}`}>
      <h1>Sprint – Team View</h1>

      {/* Sprint Details */}
      <div className="sprint-details">
        <select
          value={currentSprint.name}
          onChange={(e) => handleFieldChange("name", e.target.value)}
        >
          <option value="">Select Sprint</option>
          {ALLOWED_SPRINT_NAMES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={currentSprint.startDate || ""}
          onChange={(e) => handleFieldChange("startDate", e.target.value)}
        />
        <input
          type="date"
          value={currentSprint.endDate || ""}
          onChange={(e) => handleFieldChange("endDate", e.target.value)}
        />

        <select
          value={currentSprint.progress}
          onChange={(e) => handleFieldChange("progress", e.target.value)}
        >
          <option>Not Started</option>
          <option>In Progress</option>
          <option>Completed</option>
        </select>

        <button onClick={handleSaveSprint}>Save Sprint</button>
      </div>

      {/* Sprint Backlog */}
      <div className="backlog-section">
        <h2>Sprint Backlog</h2>

        {sortedSprintBacklog.length === 0 ? (
          <p>No sprint items</p>
        ) : (
          <table className="backlog-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Developer</th>
                <th>Estimated</th>
                <th>Completion</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedSprintBacklog.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.priority}</td>
                  <td>
                    <select
                      value={item.completed ? "Completed" : item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                    >
                      <option>Awaiting Action</option>
                      <option>Under Development</option>
                      <option>Completed</option>
                    </select>
                  </td>
                  <td>{item.developer}</td>
                  <td>{item.estimatedTime || "-"}</td>
                  <td>{item.completionTime || "-"}</td>
                  <td>
                    {item.status === "Awaiting Action" && (
                      <button onClick={() => handleMoveBackToProductBacklog(item)}>
                        Move Back
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ProductBacklog sprints={sprints} onAddToSprintBacklog={handleAddToSprintBacklog} />
    </div>
  );
};

export default Sprint1;