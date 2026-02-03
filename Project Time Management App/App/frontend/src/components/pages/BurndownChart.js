import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { api } from "../../api";

/* ============================
   Utility: parse "2w 4d 6h 45m" → hours
============================ */
const parseTimeToHours = (timeStr = "") => {
  const regex = /^(\d+w\s*)?(\d+d\s*)?(\d+h\s*)?(\d+m\s*)?$/;
  const matches = timeStr.match(regex);

  if (!matches) return 0;

  const w = parseInt(matches[1]) || 0;
  const d = parseInt(matches[2]) || 0;
  const h = parseInt(matches[3]) || 0;
  const m = parseInt(matches[4]) || 0;

  return w * 40 + d * 8 + h + m / 60;
};

const BurndownChart = ({ sprint }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    if (!sprint?.name || !sprint.startDate || !sprint.endDate) {
      setData([]);
      return;
    }

    const loadBurndown = async () => {
      try {
        // ✅ Fetch sprint backlog from MongoDB
        const res = await api.get(
          `/api/sprints/${encodeURIComponent(sprint.name)}/items`
        );

        const backlog = res.data || [];

        const startDate = new Date(sprint.startDate);
        const endDate = new Date(sprint.endDate);

        const totalEstimated = backlog.reduce(
          (sum, item) => sum + parseTimeToHours(item.estimatedTime),
          0
        );

        const dayCount =
          Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

        let remaining = totalEstimated;
        const chartData = [];

        // Day 0
        chartData.push({
          date: startDate.toISOString().split("T")[0],
          Remaining: Number(totalEstimated.toFixed(2)),
        });

        for (let i = 1; i < dayCount; i++) {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + i);
          const dateStr = date.toISOString().split("T")[0];

          const completedToday = backlog.filter(
            (item) =>
              item.status === "Completed" &&
              item.completedInSprint === sprint.name
          );

          const completedHours = completedToday.reduce(
            (sum, item) => sum + parseTimeToHours(item.estimatedTime),
            0
          );

          remaining -= completedHours;
          if (remaining < 0) remaining = 0;

          chartData.push({
            date: dateStr,
            Remaining: Number(remaining.toFixed(2)),
          });
        }

        // Ideal line
        const idealPerDay = totalEstimated / dayCount;
        const finalData = chartData.map((point, idx) => ({
          date: point.date,
          Remaining: point.Remaining,
          Ideal: Number(
            Math.max(totalEstimated - idealPerDay * idx, 0).toFixed(2)
          ),
        }));

        setData(finalData);
      } catch (err) {
        console.error("❌ Failed to load burndown:", err);
        setData([]);
      }
    };

    loadBurndown();
  }, [sprint]);

  if (!sprint) {
    return <p>Please select a sprint to view the burndown chart.</p>;
  }

  if (data.length === 0) {
    return <p>No burndown data available.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis />
        <Tooltip />
        <Legend />

        <Line
          type="monotone"
          dataKey="Remaining"
          stroke="#ff00ff"
          strokeWidth={3}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />

        <Line
          type="monotone"
          dataKey="Ideal"
          stroke="#00ffff"
          strokeWidth={3}
          strokeDasharray="5 5"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default BurndownChart;
