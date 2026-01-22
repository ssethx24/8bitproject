import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminView.css';

//  Render backend base URL
const API_BASE = 'https://eightbitproject.onrender.com';

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
    setTasks(JSON.parse(localStorage.getItem('backlogItems')) || []);
  };

  // Fetch the list of users from the deployed backend
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      alert('Failed to fetch users. Check backend/CORS.');
    }
  };

  //  Add a new user (POST /api/users)
  const handleAddUser = async () => {
    if (!newEmail || !newPassword) {
      alert('Please enter both email and password.');
      return;
    }

    try {
      await axios.post(`${API_BASE}/api/users`, {
        email: newEmail,
        password: newPassword
      });

      await fetchUsers();
      setNewEmail('');
      setNewPassword('');
      alert('User added: ' + newEmail);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Unknown error while adding user';
      alert('Failed to add user: ' + msg);
    }
  };

  // Delete user (DELETE /api/users/<email>)
  const handleDeleteUser = async (email) => {
    try {
      await axios.delete(`${API_BASE}/api/users/${encodeURIComponent(email)}`);
      await fetchUsers();
      alert('User deleted: ' + email);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Unknown error while deleting user';
      alert('Failed to delete user: ' + msg);
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
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Password"
        />
        <button onClick={handleAddUser}>Add Developer</button>
      </div>

      {/* List of current developers */}
      <h3>Current Developers</h3>
      <div className="user-list">
        <table className="user-table">
          <tbody>
            {users.map((user) => (
              <tr key={user.email} className="user-row">
                <td>{user.email}</td>
                <td>
                  {/* Show the "Remove" button only for non-ScrumMaster users */}
                  {!user.email.includes('scrummaster') && (
                    <button
                      className="remove-button"
                      onClick={() => handleDeleteUser(user.email)}
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
          {tasks.map((task, index) => (
            <tr key={task.id || index}>
              <td>{index + 1}</td>
              <td>{task.title}</td>
              <td>{task.priority}</td>
              <td>{task.status}</td>
              <td>
                <select defaultValue="">
                  <option value="" disabled>
                    Select Developer
                  </option>
                  {users.map((user) => (
                    <option key={user.email} value={user.email}>
                      {user.email}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input type="number" placeholder="Hours" min="0" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminView;
