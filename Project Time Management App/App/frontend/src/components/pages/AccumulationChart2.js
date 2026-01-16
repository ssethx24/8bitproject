import React from 'react';
import { Bar } from 'react-chartjs-2';
import PropTypes from 'prop-types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './AccumulationChart.css'; // Import the CSS file for custom styling

// Register Chart.js components that will be used in the bar chart
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AccumulationChart2 = ({ sprintBacklog = [] }) => {
  // Debugging Logs: Log sprint backlog to inspect the incoming data
  console.log('AccumulationChart2 Props:', { sprintBacklog });

  // Defensive Coding: If sprintBacklog is empty or not an array, show an error message
  if (!Array.isArray(sprintBacklog) || sprintBacklog.length === 0) {
    return <p>No data available to display the chart.</p>;
  }

  // Utility function to parse time strings (e.g., "1w 2d 3h 30m") into total hours
  const parseTimeToHours = (timeStr) => {
    const regex = /^(\d+)w\s*(\d+)d\s*(\d+)h\s*(\d+)m$/; // Regex pattern to match the time format
    const matches = timeStr.match(regex);

    if (!matches) return 0; // Return 0 if the time format doesn't match

    const weeks = parseInt(matches[1], 10); // Convert weeks to integer
    const days = parseInt(matches[2], 10); // Convert days to integer
    const hours = parseInt(matches[3], 10); // Convert hours to integer
    const minutes = parseInt(matches[4], 10); // Convert minutes to integer

    // Return total hours, assuming 1 week = 40 hours and 1 day = 8 hours
    return weeks * 40 + days * 8 + hours + minutes / 60;
  };

  // Accumulate actual hours worked by each developer
  const developerHours = sprintBacklog.reduce((acc, item) => {
    if (item.developer && item.completionTime) {
      const hours = parseTimeToHours(item.completionTime); // Parse the completion time into hours
      if (!acc[item.developer]) {
        acc[item.developer] = 0; // Initialize if the developer is not in the accumulator yet
      }
      acc[item.developer] += hours; // Add hours to the developer's total
    }
    return acc;
  }, {});

  // Generate unique colors for each developer's bar in the chart
  const generateColors = (length) => {
    const colors = [
      'rgba(255, 99, 132, 0.6)',
      'rgba(54, 162, 235, 0.6)',
      'rgba(255, 206, 86, 0.6)',
      'rgba(75, 192, 192, 0.6)',
      'rgba(153, 102, 255, 0.6)',
      'rgba(255, 159, 64, 0.6)',
      'rgba(199, 199, 199, 0.6)',
    ];
    return Array.from({ length }, (_, i) => colors[i % colors.length]); // Cycle through colors if more developers than colors
  };

  const developerNames = Object.keys(developerHours); // Extract developer names for the x-axis labels
  const developerData = Object.values(developerHours); // Extract hours worked by each developer for the chart data
  const developerColors = generateColors(developerNames.length); // Assign colors to each developer

  // Prepare the data object for the bar chart
  const data = {
    labels: developerNames, // Developer names as labels on the x-axis
    datasets: [
      {
        label: 'Actual Hours', // Label for the dataset
        data: developerData, // Data representing hours worked by each developer
        backgroundColor: developerColors, // Color each bar according to developer
      },
    ],
  };

  // Chart configuration options
  const options = {
    responsive: true, // Make the chart responsive to screen size
    plugins: {
      title: {
        display: true, // Display a title at the top of the chart
        text: 'Actual Hours Worked by Developer', // Title text
        font: {
          size: 20, // Font size of the title
        },
      },
      legend: {
        position: 'top', // Position the legend at the top of the chart
      },
      tooltip: {
        mode: 'index', // Tooltip mode to show values for all datasets when hovering
        intersect: false, // Tooltip shows even if not directly over the bar
      },
    },
    scales: {
      y: {
        beginAtZero: true, // Start y-axis from 0
        title: {
          display: true, // Display y-axis title
          text: 'Hours', // Text for the y-axis title
          font: {
            size: 16, // Font size for the y-axis title
          },
        },
      },
      x: {
        title: {
          display: true, // Display x-axis title
          text: 'Developer', // Text for the x-axis title
          font: {
            size: 16, // Font size for the x-axis title
          },
        },
      },
    },
  };

  // Render the bar chart using the prepared data and options
  return <Bar data={data} options={options} />;
};

// Define PropTypes to ensure correct data types are passed as props
AccumulationChart2.propTypes = {
  sprintBacklog: PropTypes.arrayOf(
    PropTypes.shape({
      developer: PropTypes.string, // Developer's name as a string
      completionTime: PropTypes.string, // Completion time as a string in "1w 2d 3h 30m" format
    })
  ),
};

export default AccumulationChart2;
