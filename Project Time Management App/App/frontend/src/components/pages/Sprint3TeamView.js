import React, { useState, useEffect, useContext } from "react";
import ProductBacklog from "./ProductBacklogTeamView";
import "./SprintPage.css";
import { ThemeContext } from "../../contexts/theme-context";
import { api } from "../../api";

const Sprint1 = () => {
  const defaultSprintName = "";
  const allowedSprintNames = ["Sprint 1", "Sprint 2", "Sprint 3"];
  const { theme } = useContext(ThemeContext);

  // ✅ Keep sprint metadata local for now
  const [sprints, setSprints] = useState(() => {
    const savedSprints = localStorage.getItem("sprints");
    return savedSprints ? JSON.parse(savedSprints) : [];
  });

  const [currentSprint, setCurrentSprint] = useState({
    name: defaultSprintName,
    startDate: "",
    endDate: "",
    progress: "Not Started",
  });

  // ✅ Sprint backlog from MongoDB
  const [sprintBacklog, setSprintBacklog] = useState([]);

  const [isEditing, setIsEditing] = useState(false);
  const [isBacklogEditing, setIsBacklogEditing] = useState(false);

  // Sprint sorting
  const [sprintSortCriteria, setSprintSortCriteria] = useState("name");
  const [sprintSortOrder, setSprintSortOrder] = useState("asc");

  // Backlog sorting
  const [backlogSortCriteria, setBacklogSortCriteria] = useState("title");
  const [backlogSortOrder, setBacklogSortOrder] = useState("asc");
  const [backlogSortDeveloperOrder, setBacklogSortDeveloperOrder] = useState("asc");

  const [estimatedTimeError, setEstimatedTimeError] = useState("");
  const [completionTimeError, setCompletionTimeError] = useState("");

  // Regex to match format like "2w 4d 6h 45m"
  const timeFormatRegex = /^(\d+w\s*)?(\d+d\s*)?(\d+h\s*)?(\d+m\s*)?$/;

  useEffect(() => {
    localStorage.setItem("sprints", JSON.stringify(sprints));
  }, [sprints]);

  // ✅ Load sprint backlog items whenever currentSprint.name changes
  useEffect(() => {
    const sprintName = currentSprint.name;
    if (!sprintName) {
      setSprintBacklog([]);
      return;
    }

    const loadSprintBacklog = async () => {
      try {
        const res = await api.get(`/api/sprints/${encodeURIComponent(sprintName)}/items`);

        const normalized = (res.data || []).map((it) => ({
          id: it.clientId || it.id || it._id, // keep existing usage item.id
          title: it.title,
          priority: it.priority,
          developer: it.developer || "Daksh",
          status: it.status || "Awaiting Action",
          completed: it.completed ?? false,
          sprint: it.sprintName || sprintName, // keep "sprint" like before
          estimatedTime: it.estimatedTime || "",
          completionTime: it.completionTime || "",
        }));

        setSprintBacklog(normalized);
      } catch (err) {
        console.error("❌ Failed to load sprint backlog:", err);
        alert("Failed to load sprint backlog from server.");
      }
    };

    loadSprintBacklog();
  }, [currentSprint.name]);

  const handleFieldChange = (field, value) => {
    const updatedSprint = { ...currentSprint, [field]: value };
    setCurrentSprint(updatedSprint);
  };

  const handleSaveSprint = () => {
    if (!allowedSprintNames.includes(currentSprint.name)) {
      alert("Invalid sprint name. Please select one from the available options.");
      return;
    }

    const isNameUsed = sprints.some((sprint) => sprint.name === currentSprint.name);
    if (isNameUsed && !isEditing) {
      alert("This sprint name has already been used. Please choose a different name.");
      return;
    }

    if (
      currentSprint.startDate &&
      currentSprint.endDate &&
      currentSprint.startDate > currentSprint.endDate
    ) {
      alert("Start date cannot be after the end date. Please adjust the dates.");
      return;
    }

    if (isEditing) {
      const updatedSprints = sprints.map((sprint) =>
        sprint.name === currentSprint.name ? currentSprint : sprint
      );
      setSprints(updatedSprints);
    } else {
      setSprints([...sprints, currentSprint]);
    }

    setIsEditing(false);
    setCurrentSprint({
      name: defaultSprintName,
      startDate: "",
      endDate: "",
      progress: "Not Started",
    });
  };

  // ✅ Persist status updates to MongoDB
  const handleStatusChange = async (id, newStatus) => {
    try {
      const payload = {
        status: newStatus,
        completed: newStatus === "Completed",
      };

      const res = await api.put(`/api/backlog/${id}`, payload);
      const updated = res.data;

      setSprintBacklog((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: updated.status,
                completed: updated.completed,
              }
            : item
        )
      );
    } catch (err) {
      console.error("❌ Status update failed:", err);
      alert("Failed to update status (server error).");
    }
  };

  // ✅ Move task back to Product Backlog (MongoDB)
  const handleMoveBackToProductBacklog = async (item) => {
    try {
      await api.put(`/api/backlog/${item.id}`, {
        sprintName: null,
        status: "Awaiting Action",
        completed: false,
        estimatedTime: "",
        completionTime: "",
      });

      // remove from sprint list
      setSprintBacklog((prev) => prev.filter((x) => x.id !== item.id));
    } catch (err) {
      console.error("❌ Move back failed:", err);
      alert("Failed to move back to Product Backlog.");
    }
  };

  // ✅ Called by ProductBacklogTeamView when adding item to sprint
  const handleAddToSprintBacklog = async (item, sprintName) => {
    try {
      const res = await api.put(`/api/backlog/${item.id}`, {
        sprintName,
        status: "Awaiting Action",
        completed: false,
        estimatedTime: "",
        completionTime: "",
      });

      const updated = res.data;

      // Only add to table if the selected sprint matches current sprint
      if (sprintName === currentSprint.name) {
        setSprintBacklog((prev) => [
          ...prev,
          {
            id: updated.clientId || updated._id,
            title: updated.title,
            priority: updated.priority,
            developer: updated.developer || "Daksh",
            status: updated.status || "Awaiting Action",
            completed: updated.completed ?? false,
            sprint: updated.sprintName || sprintName,
            estimatedTime: updated.estimatedTime || "",
            completionTime: updated.completionTime || "",
          },
        ]);
      }
    } catch (err) {
      console.error("❌ Add to sprint failed:", err);
      alert("Failed to add to sprint (server error).");
    }
  };

  const handleEditSprint = (sprintName) => {
    const sprintToEdit = sprints.find((sprint) => sprint.name === sprintName);
    setCurrentSprint(sprintToEdit);
    setIsEditing(true);
  };

  const handleDeleteSprint = (sprintName) => {
    const updatedSprints = sprints.filter((sprint) => sprint.name !== sprintName);
    setSprints(updatedSprints);

    if (currentSprint.name === sprintName) {
      setCurrentSprint({
        name: defaultSprintName,
        startDate: "",
        endDate: "",
        progress: "Not Started",
      });
    }
  };

  // ✅ In MongoDB mode, "Edit Backlog" is just UI toggling
  const toggleBacklogEditing = () => {
    setIsBacklogEditing((prev) => !prev);
  };

  const validateTimeFormat = (time, isCompletion = false) => {
    if (!timeFormatRegex.test(time)) {
      if (isCompletion) setCompletionTimeError("Invalid format! Use format: 2w 4d 6h 45m");
      else setEstimatedTimeError("Invalid format! Use format: 2w 4d 6h 45m");
    } else {
      if (isCompletion) setCompletionTimeError("");
      else setEstimatedTimeError("");
    }
  };

  const filteredSprintBacklog = sprintBacklog.filter((item) => item.sprint === currentSprint.name);

  const sortSprints = (sprintsList) => {
    return [...sprintsList].sort((a, b) => {
      if (sprintSortCriteria === "name") {
        return sprintSortOrder === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sprintSortCriteria === "startDate") {
        return sprintSortOrder === "asc"
          ? new Date(a.startDate) - new Date(b.startDate)
          : new Date(b.startDate) - new Date(a.startDate);
      } else if (sprintSortCriteria === "endDate") {
        return sprintSortOrder === "asc"
          ? new Date(a.endDate) - new Date(b.endDate)
          : new Date(b.endDate) - new Date(a.endDate);
      } else {
        return 0;
      }
    });
  };

  const sortBacklog = (backlog) => {
    return [...backlog].sort((a, b) => {
      if (backlogSortCriteria === "title") {
        return backlogSortOrder === "asc"
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      } else if (backlogSortCriteria === "priority") {
        return backlogSortOrder === "asc"
          ? a.priority.localeCompare(b.priority)
          : b.priority.localeCompare(a.priority);
      } else if (backlogSortCriteria === "status") {
        return backlogSortOrder === "asc"
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      } else if (backlogSortCriteria === "developer") {
        return backlogSortDeveloperOrder === "asc"
          ? a.developer.localeCompare(b.developer)
          : b.developer.localeCompare(a.developer);
      } else {
        return 0;
      }
    });
  };

  const sortedSprints = sortSprints(sprints);
  const sortedSprintBacklog = sortBacklog(filteredSprintBacklog);

  return (
    <div className={`sprint-page theme-${theme}`}>
      <h1>Sprint - 1</h1>

      <div className="sprint-details">
        <div className="field-group">
          <label>Sprint Name: </label>
          <select value={currentSprint.name} onChange={(e) => handleFieldChange("name", e.target.value)}>
            <option value={defaultSprintName}>{defaultSprintName}</option>
            {allowedSprintNames.map((name) => (
              <option
                key={name}
                value={name}
                disabled={sprints.some((sprint) => sprint.name === name && sprint.progress === "Completed")}
              >
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label>Start Date: </label>
          <input
            type="date"
            value={currentSprint.startDate}
            onChange={(e) => handleFieldChange("startDate", e.target.value)}
          />
        </div>

        <div className="field-group">
          <label>End Date: </label>
          <input
            type="date"
            value={currentSprint.endDate}
            onChange={(e) => handleFieldChange("endDate", e.target.value)}
          />
        </div>

        <div className="field-group">
          <label>Progress: </label>
          <select value={currentSprint.progress} onChange={(e) => handleFieldChange("progress", e.target.value)}>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <button onClick={handleSaveSprint}>{isEditing ? "Save Modified Details" : "Save Sprint"}</button>
      </div>

      <div className="sprint-list">
        <h2>Sprints</h2>

        <div className="sort-controls">
          <label htmlFor="sprint-sort-criteria">Sort by:</label>
          <select
            id="sprint-sort-criteria"
            value={sprintSortCriteria}
            onChange={(e) => setSprintSortCriteria(e.target.value)}
          >
            <option value="name">Name</option>
            <option value="startDate">Start Date</option>
            <option value="endDate">End Date</option>
          </select>

          <label htmlFor="sprint-sort-order">Order:</label>
          <select
            id="sprint-sort-order"
            value={sprintSortOrder}
            onChange={(e) => setSprintSortOrder(e.target.value)}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        {sprints.length === 0 ? (
          <p>No sprints available.</p>
        ) : (
          <ul>
            {sortedSprints.map((sprint) => (
              <li key={sprint.name} className="sprint-item">
                <div><strong>Name:</strong> {sprint.name}</div>
                <div><strong>Start Date:</strong> {sprint.startDate}</div>
                <div><strong>End Date:</strong> {sprint.endDate}</div>
                <div><strong>Progress:</strong> {sprint.progress}</div>

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

      <div className="backlog-section">
        <h2>Sprint Backlog for {currentSprint.name}</h2>

        <div className="sort-controls">
          <label htmlFor="backlog-sort-criteria">Sort by:</label>
          <select
            id="backlog-sort-criteria"
            value={backlogSortCriteria}
            onChange={(e) => setBacklogSortCriteria(e.target.value)}
          >
            <option value="title">Title</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
            <option value="developer">Developer</option>
          </select>

          <label htmlFor="backlog-sort-order">Order:</label>
          <select
            id="backlog-sort-order"
            value={backlogSortOrder}
            onChange={(e) => setBacklogSortOrder(e.target.value)}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>

          <label htmlFor="backlog-sort-developer-order">Developer Order:</label>
          <select
            id="backlog-sort-developer-order"
            value={backlogSortDeveloperOrder}
            onChange={(e) => setBacklogSortDeveloperOrder(e.target.value)}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        {filteredSprintBacklog.length === 0 ? (
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
                          placeholder="Estimated Time (e.g. 2w 4d 6h 45m)"
                          value={item.estimatedTime || ""}
                          onChange={async (e) => {
                            const v = e.target.value;
                            validateTimeFormat(v);

                            setSprintBacklog((prev) =>
                              prev.map((x) => (x.id === item.id ? { ...x, estimatedTime: v } : x))
                            );

                            // ✅ Persist to MongoDB
                            await api.put(`/api/backlog/${item.id}`, { estimatedTime: v });
                          }}
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
                          placeholder="Completion Time (e.g. 2w 4d 6h 45m)"
                          value={item.completionTime || ""}
                          onChange={async (e) => {
                            const v = e.target.value;
                            validateTimeFormat(v, true);

                            setSprintBacklog((prev) =>
                              prev.map((x) => (x.id === item.id ? { ...x, completionTime: v } : x))
                            );

                            // ✅ Persist to MongoDB
                            await api.put(`/api/backlog/${item.id}`, { completionTime: v });
                          }}
                        />
                        {completionTimeError && <span className="error-message">{completionTimeError}</span>}
                      </>
                    )}
                  </td>

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

      <button onClick={toggleBacklogEditing}>
        {isBacklogEditing ? "Stop Editing" : "Edit Backlog"}
      </button>

      <ProductBacklog sprints={sprints} onAddToSprintBacklog={handleAddToSprintBacklog} />
    </div>
  );
};

export default Sprint1;