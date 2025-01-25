import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// Utility function to parse time strings (e.g., "1w 2d 3h 30m") into total hours
const parseTimeToHours = (timeStr) => {
  const regex = /^(\d+)w\s*(\d+)d\s*(\d+)h\s*(\d+)m$/; // Regex to match weeks, days, hours, and minutes
  const matches = timeStr.match(regex);

  if (!matches) return 0; // Return 0 if the format doesn't match

  // Parse each component of the time string into integers
  const weeks = parseInt(matches[1], 10) || 0;
  const days = parseInt(matches[2], 10) || 0;
  const hours = parseInt(matches[3], 10) || 0;
  const minutes = parseInt(matches[4], 10) || 0;

  // Convert weeks and days into hours, and add up all values
  return weeks * 40 + days * 8 + hours + minutes / 60; // Assuming 1 week = 40 hours, 1 day = 8 hours
};

const BurndownChart = ({ sprint }) => {
  const [data, setData] = useState([]); // State to store the chart data

  // Effect to generate the burndown chart data when the sprint changes
  useEffect(() => {
    if (!sprint) return; // If no sprint is selected, exit early

    // Retrieve the sprint backlog from localStorage
    const sprintBacklog = JSON.parse(localStorage.getItem('sprintBacklog')) || [];
    // Filter tasks related to the current sprint
    const currentSprintBacklog = sprintBacklog.filter(item => item.sprint === sprint.name);

    // Get the sprint's start and end dates
    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);

    // Calculate total estimated time for the sprint tasks
    const totalEstimated = currentSprintBacklog.reduce(
      (acc, item) => acc + parseTimeToHours(item.estimatedTime || '0w 0d 0h 0m'),
      0
    );

    // Calculate the number of days in the sprint
    const dayCount = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    let remainingWork = totalEstimated; // Initialize remaining work with the total estimated hours

    const chartData = []; // Array to hold the data points for the chart

    // Add the starting point for the burndown chart
    chartData.push({
      date: startDate.toISOString().split('T')[0], // Format date as YYYY-MM-DD
      Remaining: parseFloat(totalEstimated.toFixed(2)), // Initial remaining work
    });

    // Generate data points for each day in the sprint
    for (let i = 1; i < dayCount; i++) { // Start from day 1 to avoid duplicating the start date
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i); // Increment the date
      const dateStr = currentDate.toISOString().split('T')[0]; // Format the date as YYYY-MM-DD

      // Find tasks completed on the current day
      const completedToday = currentSprintBacklog.filter(
        item => item.status === 'Completed' && item.completionDate === dateStr
      );

      // Calculate the total work completed on the current day
      const workCompletedToday = completedToday.reduce(
        (acc, item) => acc + parseTimeToHours(item.estimatedTime || '0w 0d 0h 0m'),
        0
      );

      remainingWork -= workCompletedToday; // Subtract completed work from remaining work

      if (remainingWork < 0) remainingWork = 0; // Ensure remaining work doesn't go negative

      // Add the data point for the current day
      chartData.push({
        date: dateStr, // Current date
        Remaining: parseFloat(remainingWork.toFixed(2)), // Remaining work for the current day
      });
    }

    // Optional: Add an ideal burndown line (linear decrease from total to 0)
    const idealWorkPerDay = totalEstimated / dayCount; // Calculate ideal work per day
    const idealChartData = chartData.map((point, index) => ({
      date: point.date, // Keep the date the same
      Ideal: parseFloat((totalEstimated - idealWorkPerDay * index).toFixed(2)), // Ideal remaining work
      Remaining: point.Remaining, // Actual remaining work
    }));

    setData(idealChartData); // Update the state with the final chart data
  }, [sprint]); // Dependency array: re-run the effect when the `sprint` changes

  // If no sprint is selected, show a message
  if (!sprint) {
    return <p>Please select a sprint to view the burndown chart.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={400}> {/* Make the chart responsive */}
      <LineChart
        data={data} // Chart data (remaining work and ideal line)
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }} // Margin around the chart
      >
        <CartesianGrid strokeDasharray="3 3" /> {/* Grid lines in the chart */}
        <XAxis dataKey="date" tick={{ fontSize: 12 }} /> {/* X-axis with dates */}
        <YAxis /> {/* Y-axis for hours */}
        <Tooltip /> {/* Tooltip to show data on hover */}
        <Legend /> {/* Legend for the chart lines */}
        <Line
          type="monotone"
          dataKey="Remaining" // Remaining work data
          stroke="magenta"  /* Magenta color for the remaining work line */
          strokeWidth={3}  /* Thicker line */
          dot={{ stroke: 'magenta', strokeWidth: 2, r: 4 }}  /* Customize dots */
          activeDot={{ r: 6 }}  /* Larger dot on hover */
        />
        <Line
          type="monotone"
          dataKey="Ideal" // Ideal work data
          stroke="cyan"  /* Cyan color for the ideal work line */
          strokeWidth={3}  /* Thicker line */
          dot={false}  /* No dots for the ideal line */
          strokeDasharray="5 5"  /* Dashed line for ideal work */
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default BurndownChart;
