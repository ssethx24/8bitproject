import React, { useState, useEffect, useContext } from "react";
import AccumulationChart1 from "./AccumulationChart1";
import AccumulationChart2 from "./AccumulationChart2";
import BurndownChart from "./BurndownChart";
import "./styles.css";
import { ThemeContext } from "../../contexts/theme-context";
import { api } from "../../api";

const Charts = () => {
  const { theme } = useContext(ThemeContext);

  const [sprints, setSprints] = useState([]);
  const [selectedSprint, setSelectedSprint] = useState("");
  const [sprintBacklog, setSprintBacklog] = useState([]);

  const [estimatedHours, setEstimatedHours] = useState([]);
  const [actualHours, setActualHours] = useState([]);

  const [activeTab, setActiveTab] = useState("sprint-review");
  const [loading, setLoading] = useState(true);

  /* ============================
     Load Sprints from MongoDB
  ============================ */
  useEffect(() => {
    const loadSprints = async () => {
      try {
        const res = await api.get("/api/sprints");
        setSprints(res.data || []);
      } catch (err) {
        console.error("❌ Failed to load sprints:", err);
        alert("Failed to load sprints from server.");
      } finally {
        setLoading(false);
      }
    };

    loadSprints();
  }, []);

  /* ============================
     Load Sprint Backlog when sprint changes
  ============================ */
  useEffect(() => {
    if (!selectedSprint) {
      setSprintBacklog([]);
      setEstimatedHours([]);
      setActualHours([]);
      return;
    }

    const loadSprintBacklog = async () => {
      try {
        const res = await api.get(
          `/api/sprints/${encodeURIComponent(selectedSprint)}/items`
        );

        const items = (res.data || []).map((it) => ({
          id: it.clientId || it._id,
          title: it.title,
          developer: it.developer,
          status: it.status,
          sprint: it.sprintName,
          estimatedTime: it.estimatedTime || "",
          completionTime: it.completionTime || "",
        }));

        setSprintBacklog(items);

        // Calculate totals
        const totalEstimated = items.reduce(
          (acc, item) => acc + parseTimeToHours(item.estimatedTime),
          0
        );

        const totalActual = items.reduce(
          (acc, item) => acc + parseTimeToHours(item.completionTime),
          0
        );

        setEstimatedHours([totalEstimated]);
        setActualHours([totalActual]);
      } catch (err) {
        console.error("❌ Failed to load sprint backlog:", err);
        alert("Failed to load sprint backlog from server.");
      }
    };

    loadSprintBacklog();
  }, [selectedSprint]);

  /* ============================
     Helpers
  ============================ */
  const parseTimeToHours = (timeStr) => {
    if (!timeStr) return 0;

    const regex = /(\d+)w|(\d+)d|(\d+)h|(\d+)m/g;
    let weeks = 0,
      days = 0,
      hours = 0,
      minutes = 0;

    let match;
    while ((match = regex.exec(timeStr))) {
      if (match[1]) weeks = parseInt(match[1], 10);
      if (match[2]) days = parseInt(match[2], 10);
      if (match[3]) hours = parseInt(match[3], 10);
      if (match[4]) minutes = parseInt(match[4], 10);
    }

    return weeks * 40 + days * 8 + hours + minutes / 60;
  };

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
  };

  if (loading) {
    return <div className={`charts-page theme-${theme}`}>Loading charts…</div>;
  }

  return (
    <div className={`charts-page theme-${theme}`}>
      <h1>Charts Dashboard</h1>

      {/* Tabs */}
      <div id="dolphincontainer">
        <div id="dolphinnav">
          <ul>
            <li>
              <a
                href="#sprint-review"
                className={activeTab === "sprint-review" ? "current" : ""}
                onClick={(e) => {
                  e.preventDefault();
                  handleTabChange("sprint-review");
                }}
                style={{ fontSize: "22px" }}
              >
                <span>Sprint Review</span>
              </a>
            </li>
            <li>
              <a
                href="#developer-review"
                className={activeTab === "developer-review" ? "current" : ""}
                onClick={(e) => {
                  e.preventDefault();
                  handleTabChange("developer-review");
                }}
                style={{ fontSize: "22px" }}
              >
                <span>Developer Review</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Sprint Dropdown */}
      <div className="sprint-selection">
        <label>Select Sprint: </label>
        <select
          value={selectedSprint}
          onChange={(e) => setSelectedSprint(e.target.value)}
        >
          <option value="">-- Select a Sprint --</option>
          {sprints.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Sprint Review */}
      {activeTab === "sprint-review" && (
        <div className="tab-content">
          <h2 style={{ textAlign: "center" }}>Sprint Review</h2>

          <div className="chart-container">
            <h3 style={{ textAlign: "center" }}>Burndown Chart</h3>
            {selectedSprint ? (
              <BurndownChart
                sprint={sprints.find((s) => s.name === selectedSprint)}
              />
            ) : (
              <p>Please select a sprint.</p>
            )}
          </div>
        </div>
      )}

      {/* Developer Review */}
      {activeTab === "developer-review" && (
        <div className="tab-content">
          <h2 style={{ textAlign: "center" }}>Developer Review</h2>

          <div className="chart-container">
            <h3 style={{ textAlign: "center" }}>
              Accumulation of Work Hours per Sprint
            </h3>
            {selectedSprint ? (
              <AccumulationChart1
                estimatedHours={estimatedHours}
                actualHours={actualHours}
              />
            ) : (
              <p>Please select a sprint.</p>
            )}
          </div>

          <div className="chart-container">
            <h3 style={{ textAlign: "center" }}>
              Accumulation of Work Hours per Developer
            </h3>
            {selectedSprint ? (
              <AccumulationChart2 sprintBacklog={sprintBacklog} />
            ) : (
              <p>Please select a sprint.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Charts;