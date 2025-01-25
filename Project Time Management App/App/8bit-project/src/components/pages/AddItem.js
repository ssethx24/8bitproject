import React, { useState } from 'react';

function AddItem({ onAdd }) {
  // State to hold the values of the new item being added
  const [newItem, setNewItem] = useState({ title: '', priority: 'Medium', developer: 'Daksh' });

  // Handle input changes for the new item (title, priority, developer)
  const handleInputChange = (e) => {
    const { name, value } = e.target; // Extract name and value from the event target (input or select)
    setNewItem((prevItem) => ({
      ...prevItem,  // Spread previous item data to preserve other fields
      [name]: value, // Update the specific field (e.g., title, priority, developer)
    }));
  };

  // Handle adding the new item when the user clicks the "Add Task" button
  const handleAddItem = () => {
    if (newItem.title.trim()) { // Ensure the title is not empty
      onAdd(newItem); // Pass the new item to the parent component through the onAdd prop
      setNewItem({ title: '', priority: 'Medium', developer: 'Daksh' }); // Reset the input fields after adding
    }
  };

  return (
    <div className="add-backlog-item">
      {/* Input field for the task title */}
      <input
        type="text"
        name="title"
        placeholder="Task Title"
        value={newItem.title} // Bind the title value to the state
        onChange={handleInputChange} // Update the title state on change
      />

      {/* Dropdown menu for selecting task priority */}
      <select
        name="priority"
        value={newItem.priority} // Bind the priority value to the state
        onChange={handleInputChange} // Update the priority state on change
      >
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>

      {/* Dropdown menu for assigning a developer to the task */}
      <select
        name="developer"
        value={newItem.developer} // Bind the developer value to the state
        onChange={handleInputChange} // Update the developer state on change
      >
        <option value="Daksh">Daksh</option>
        <option value="Chetan">Chetan</option>
        <option value="Gaurav">Gaurav</option>
        <option value="Shaurya">Shaurya</option>
        <option value="Sameeksha">Sameeksha</option>
        <option value="Simran">Simran</option>
      </select>

      {/* Button to add the task */}
      <button onClick={handleAddItem}>Add Task</button>
    </div>
  );
}

export default AddItem;

