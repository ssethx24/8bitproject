import React, { useContext } from 'react';
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
import { ThemeContext } from '../../contexts/theme-context'; // Import theme context to apply theme-based styles
import './AccumulationChart.css'; // Import the CSS file for custom styles

// Register Chart.js components that will be used in the chart
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AccumulationChart1 = ({ estimatedHours = [], actualHours = [] }) => {
  // Access the current theme (dark or light) using ThemeContext
  const { theme } = useContext(ThemeContext);

  // Debugging Logs: Logs the estimated and actual hours to help troubleshoot
  console.log('AccumulationChart1 Props:', { estimatedHours, actualHours });

  // Defensive Coding: If no data is passed to the chart, display a message
  if (
    !Array.isArray(estimatedHours) || // Check if estimatedHours is an array
    !Array.isArray(actualHours) || // Check if actualHours is an array
    estimatedHours.length === 0 || // Check if there's any data in estimatedHours
    actualHours.length === 0 // Check if there's any data in actualHours
  ) {
    return <p>No data available to display the chart.</p>; // Display this if there's no data
  }

  // Chart data configuration
  const data = {
    labels: ['Sprint'], // Single label for the sprint
    datasets: [
      {
        label: 'Estimated Hours', // Label for estimated hours
        data: estimatedHours, // Data for estimated hours
        backgroundColor: 'rgba(75, 192, 192, 0.6)', // Color for estimated hours bar
      },
      {
        label: 'Actual Hours', // Label for actual hours
        data: actualHours, // Data for actual hours
        backgroundColor: 'rgba(255, 99, 132, 0.6)', // Color for actual hours bar
      },
    ],
  };

  // Chart options configuration
  const options = {
    responsive: true, // Make the chart responsive to different screen sizes
    plugins: {
      title: {
        display: true, // Display chart title (can customize later)
        text: '', // Chart title (currently empty, can be customized)
        font: {
          size: 20, // Font size for the title
        },
      },
      legend: {
        position: 'top', // Position the legend at the top of the chart
      },
      tooltip: {
        mode: 'index', // Tooltip mode that shows the data from all datasets on hover
        intersect: false, // Tooltips appear even if hovering near data points
      },
    },
    scales: {
      y: {
        beginAtZero: true, // Start the Y-axis at zero
        title: {
          display: true, // Display title on Y-axis
          text: 'Hours', // Title text for Y-axis
          font: {
            size: 16, // Font size for Y-axis title
          },
        },
      },
      x: {
        title: {
          display: true, // Display title on X-axis
          text: 'Sprint', // Title text for X-axis
          font: {
            size: 16, // Font size for X-axis title
          },
        },
      },
    },
  };

  return (
    // Apply theme-based CSS class to the chart container
    <div className={`accumulation-chart theme-${theme}`}>
      <Bar data={data} options={options} /> {/* Render the Bar chart */}
    </div>
  );
};

// Define PropTypes for component props to ensure correct data types
AccumulationChart1.propTypes = {
  estimatedHours: PropTypes.arrayOf(PropTypes.number), // Prop validation for estimated hours
  actualHours: PropTypes.arrayOf(PropTypes.number), // Prop validation for actual hours
};

export default AccumulationChart1;
