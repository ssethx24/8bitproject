import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminView.css'; // Ensure you have the appropriate CSS for styling

function AdminView() {
    // State to manage tasks from the product backlog
    const [tasks, setTasks] = useState([]);  
    // State to manage the list of developers/users
    const [users, setUsers] = useState([]);  
    // State to manage the new user's email during the "add user" process
    const [newEmail, setNewEmail] = useState('');  
    // State to manage the new user's password during the "add user" process
    const [newPassword, setNewPassword] = useState('');

    // Fetch tasks and users when the component mounts
    useEffect(() => {
        fetchTasks();
        fetchUsers();
    }, []);

    // Fetch tasks from local storage and update the state
    const fetchTasks = async () => {
        // Get tasks from local storage (backlogItems) or set an empty array if none exist
        setTasks(JSON.parse(localStorage.getItem('backlogItems')) || []);
    };

    // Fetch the list of users from the backend (using Axios to get users from the server)
    const fetchUsers = async () => {
        try {
            const response = await axios.get('http://localhost:5000/users');
            setUsers(response.data); // Update the state with the list of users
        } catch (error) {
            console.error('Failed to fetch users:', error); // Log errors in fetching users
        }
    };

    // Handle adding a new user to the system
    const handleAddUser = async () => {
        try {
            await axios.post('http://localhost:5000/users', {
                email: newEmail, // Send the email and password to the backend
                password: newPassword
            });
            fetchUsers();  // Refresh the list of users after adding a new one
            setNewEmail(''); // Clear the email input field
            setNewPassword(''); // Clear the password input field
            alert('User added: ' + newEmail); // Show success alert
        } catch (error) {
            alert('Failed to add user: ' + error.response.data.message); // Show error alert
        }
    };

    // Handle deleting a user by email
    const handleDeleteUser = async (email) => {
        try {
            await axios.delete(`http://localhost:5000/users/${email}`); // Send DELETE request to the backend
            fetchUsers();  // Refresh the list of users after deletion
            alert('User deleted: ' + email); // Show success alert
        } catch (error) {
            alert('Failed to delete user: ' + error.response.data.message); // Show error alert
        }
    };

    return (
        <div className="admin-view">
            {/* Section for adding new developers */}
            <h2>Manage Developers</h2>
            <h3>Add New</h3>
            <div className="user-input">
                <input
                    type="text"
                    value={newEmail} // Bind the newEmail state to the input
                    onChange={e => setNewEmail(e.target.value)} // Update state on change
                    placeholder="Email"
                />
                <input
                    type="password"
                    value={newPassword} // Bind the newPassword state to the input
                    onChange={e => setNewPassword(e.target.value)} // Update state on change
                    placeholder="Password"
                />
                <button onClick={handleAddUser}>Add Developer</button> {/* Button to add a new user */}
            </div>

            {/* List of current developers */}
            <h3>Current Developers</h3>
            <div className="user-list">
                <table className="user-table">
                    <tbody>
                        {users.map(user => (
                            <tr key={user.email} className="user-row">
                                <td>{user.email}</td>
                                <td>
                                    {/* Show the "Remove" button only for non-ScrumMaster users */}
                                    {!user.email.includes('scrummaster') && (
                                        <button
                                            className="remove-button"
                                            onClick={() => handleDeleteUser(user.email)} // Handle user deletion
                                        >
                                            Remove
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Product backlog section */}
            <h2>Product Backlog</h2>
            <table className="backlog-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Task</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Assigned To</th>
                        <th>Time Spent (hrs)</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Display each task from the product backlog */}
                    {tasks.map((task, index) => (
                        <tr key={task.id}>
                            <td>{index + 1}</td> {/* Task ID */}
                            <td>{task.title}</td> {/* Task title */}
                            <td>{task.priority}</td> {/* Task priority */}
                            <td>{task.status}</td> {/* Task status */}
                            <td>
                                {/* Dropdown to assign a developer to the task */}
                                <select defaultValue="">
                                    <option value="" disabled>Select Developer</option>
                                    {users.map(user => (
                                        <option key={user.email} value={user.email}>{user.email}</option> 
                                    ))}
                                </select>
                            </td>
                            <td><input type="number" placeholder="Hours" min="0" /></td> {/* Time spent input */}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default AdminView;
