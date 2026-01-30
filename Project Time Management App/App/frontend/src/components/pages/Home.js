import React, { useState, useEffect, useContext, useMemo } from "react";
import "./Home.css";
import { ThemeContext } from "../../contexts/theme-context";
import { api } from "../../api";

function HomePage() {
  const { theme } = useContext(ThemeContext);

  const [sprints, setSprints] = useState([]);
  const [sprintItemsByName, setSprintItemsByName] = useState({});
  const [currentSprint, setCurrentSprint] = useState(""); // ✅ no default "Sprint 1"
  const [isFetching, setIsFetching] = useState(false); // ✅ no "Loading..." UI

  useEffect(() => {
    const load = async () => {
      try {
        setIsFetching(true);

        // 1) Load all CREATED sprints from DB
        const sprintsRes = await api.get("/api/sprints");
        const fetchedSprints = sprintsRes.data || [];

        // ✅ OPTIONAL: hide "Not Started" sprints on Home
        // If you want Home to show ONLY started sprints, uncomment:
        const visibleSprints = fetchedSprints.filter(s => s.progress !== "Not Started");
        setSprints(visibleSprints);

        setSprints(fetchedSprints);

        // ✅ Set selected sprint safely
        const sprintNames = fetchedSprints.map((s) => s.name);

        setCurrentSprint((prev) => {
          if (prev && sprintNames.includes(prev)) return prev;
          return sprintNames[0] || ""; // ✅ if none exist, keep empty
        });

        // 2) Load sprint items only for those sprints
        const results = await Promise.all(
          fetchedSprints.map(async (s) => {
            const res = await api.get(`/api/sprints/${encodeURIComponent(s.name)}/items`);
            return [s.name, res.data || []];
          })
        );

        const map = {};
        for (const [name, items] of results) {
          map[name] = items.map((it) => ({
            id: it.clientId || it.id || it._id,
            title: it.title,
            status: it.status || "Awaiting Action",
            sprint: it.sprintName || name,
          }));
        }

        setSprintItemsByName(map);
      } catch (err) {
        console.error("❌ Failed to load Home data:", err);
        alert("Failed to load sprint data from server.");
      } finally {
        setIsFetching(false);
      }
    };

    load();
  }, []);

  // ✅ If no sprint selected, no board items
  const filteredSprintBacklog = useMemo(() => {
    if (!currentSprint) return [];
    return sprintItemsByName[currentSprint] || [];
  }, [sprintItemsByName, currentSprint]);

  const calculateSprintProgress = (sprintName) => {
    const items = sprintItemsByName[sprintName] || [];
    const total = items.length;
    const done = items.filter((t) => t.status === "Completed").length;
    return total === 0 ? 0 : Math.floor((done / total) * 100);
  };

  const getSprintStatus = (sprint) => {
    return sprint.progress || "Not Started";
  };

  return (
    <div className={`homepage-container theme-${theme}`}>
      {/* Logo */}
      <div className="logo-container">
        <img
          src={`${process.env.PUBLIC_URL}/8bit.jpg`}
          alt="Logo"
          className="logo"
        />
      </div>

      {/* Sprint Summary */}
      <div className="sprint-summary">
        <h1>Sprint Overview</h1>

        {sprints.length === 0 ? (
          <p>No sprints available.</p>
        ) : (
          sprints.map((sprint) => {
            const progressPercentage = calculateSprintProgress(sprint.name);
            const sprintStatus = getSprintStatus(sprint);

            const sprintTasks = sprintItemsByName[sprint.name] || [];
            const completedTasksCount = sprintTasks.filter(
              (t) => t.status === "Completed"
            ).length;

            return (
              <div key={sprint.name} className="sprint-status">
                <h2>
                  {sprint.name} - {progressPercentage}% complete
                </h2>
                <p>Status: {sprintStatus}</p>
                <p>
                  Tasks Completed: {completedTasksCount}/{sprintTasks.length}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Sprint Selection */}
      {sprints.length > 0 && (
        <div className="sprint-selection">
          <label>Select Sprint:</label>
          <select
            value={currentSprint}
            onChange={(e) => setCurrentSprint(e.target.value)}
          >
            {sprints.map((sprint) => (
              <option key={sprint.name} value={sprint.name}>
                {sprint.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Sprint Board */}
      {currentSprint && (
        <div className="sprint-board">
          <h2>Sprint Board</h2>

          <div className="task-board">
            {/* Awaiting Action */}
            <div className="task-column awaiting-action">
              <h3>Awaiting Action</h3>
              <ul>
                {filteredSprintBacklog.filter((t) => t.status === "Awaiting Action").length >
                0 ? (
                  filteredSprintBacklog
                    .filter((t) => t.status === "Awaiting Action")
                    .map((t) => <li key={t.id}>{t.title}</li>)
                ) : (
                  <li>No tasks awaiting action</li>
                )}
              </ul>
            </div>

            {/* Under Development */}
            <div className="task-column in-progress">
              <h3>Under Development</h3>
              <ul>
                {filteredSprintBacklog.filter((t) => t.status === "Under Development").length >
                0 ? (
                  filteredSprintBacklog
                    .filter((t) => t.status === "Under Development")
                    .map((t) => <li key={t.id}>{t.title}</li>)
                ) : (
                  <li>No tasks under development</li>
                )}
              </ul>
            </div>

            {/* Completed */}
            <div className="task-column completed">
              <h3>Completed</h3>
              <ul>
                {filteredSprintBacklog.filter((t) => t.status === "Completed").length > 0 ? (
                  filteredSprintBacklog
                    .filter((t) => t.status === "Completed")
                    .map((t) => <li key={t.id}>{t.title}</li>)
                ) : (
                  <li>No tasks completed</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Optional: silent fetch indicator without "Loading..." text */}
      {/* {isFetching && <div className="silent-fetch-indicator" />} */}
    </div>
  );
}

export default HomePage;