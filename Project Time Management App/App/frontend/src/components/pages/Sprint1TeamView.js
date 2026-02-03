import React, { useEffect, useMemo, useState, useContext } from "react";
import ProductBacklog from "./ProductBacklogTeamView";
import "./SprintPage.css";
import { ThemeContext } from "../../contexts/theme-context";
import { api } from "../../api";

const ALLOWED_SPRINT_NAMES = ["Sprint 1", "Sprint 2", "Sprint 3"];

const Sprint1TeamView = () => {
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
  const [backlogSortCriteria, setBacklogSortCriteria] = useState("title");
  const [backlogSortOrder, setBacklogSortOrder] = useState("asc");
  const [backlogSortDeveloperOrder, setBacklogSortDeveloperOrder] = useState("asc");

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
     Load sprint details + backlog when sprint changes
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
        // 1) Sprint details
        const sprintRes = await api.get(
          `/api/sprints/${encodeURIComponent(currentSprint.name)}`
        );

        setCurrentSprint((prev) => ({
          ...prev,
          startDate: sprintRes.data?.startDate || "",
          endDate: sprintRes.data?.endDate || "",
          progress: sprintRes.data?.progress || "Not Started",
        }));

        // 2) Sprint items
        const res = await api.get(
          `/api/sprints/${encodeURIComponent(currentSprint.name)}/items`
        );

        const normalized = (res.data || []).map((it) => ({
          id: it.clientId || it._id || it.id,
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
        console.error("❌ Failed to load sprint:", err);
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

  // Team can update status (if you want read-only, tell me)
  const handleStatusChange = async (id, newStatus) => {
    try {
      const payload = {
        status: newStatus,
        completed: newStatus === "Completed",
      };

      const res = await api.put(`/api/backlog/${encodeURIComponent(id)}`, payload);

      setSprintBacklog((prev) =>
        prev.map((x) =>
          x.id === id
            ? { ...x, status: res.data.status, completed: res.data.completed }
            : x
        )
      );
    } catch (err) {
      console.error("❌ Status update failed:", err);
      alert("Failed to update status");
    }
  };

  // Refresh after ProductBacklogTeamView adds something
  const handleAddToSprintBacklog = async (_item, sprintName) => {
    if (!sprintName || sprintName !== currentSprint.name) return;

    try {
      const res = await api.get(`/api/sprints/${encodeURIComponent(sprintName)}/items`);
      const normalized = (res.data || []).map((it) => ({
        id: it.clientId || it._id || it.id,
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

      {/* Sprint Details (same layout idea as Scrum Master, but read-only) */}
      <div className="sprint-details">
        <div className="field-group">
          <label>Sprint Name:</label>
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

      {/* Sprint Backlog */}
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
                  <th>Estimated</th>
                  <th>Completion</th>
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
                    <td>{item.estimatedTime || "-"}</td>
                    <td>{item.completionTime || "-"}</td>
                    <td>{item.status === "Completed" ? item.completionDate || "--" : "--"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ProductBacklog Team View */}
      <ProductBacklog sprints={sprints} onAddToSprintBacklog={handleAddToSprintBacklog} />
    </div>
  );
};

export default Sprint1TeamView;