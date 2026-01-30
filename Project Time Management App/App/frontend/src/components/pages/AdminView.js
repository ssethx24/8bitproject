import React, { useEffect, useMemo, useState } from "react";
import "./AdminView.css";
import { api } from "../../api"; // ✅ use your axios instance (handles baseURL + Authorization)

function AdminView() {
  // Product backlog tasks (MongoDB)
  const [tasks, setTasks] = useState([]);

  // Users/devs (MongoDB)
  const [users, setUsers] = useState([]);

  // Add user fields
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  // ✅ Fetch Product Backlog tasks from server (NOT localStorage)
  const fetchTasks = async () => {
    try {
      setLoadingTasks(true);
      const res = await api.get("/api/backlog");

      // normalize id for UI
      const normalized = (res.data || []).map((it) => ({
        id: it.clientId || it._id,
        title: it.title,
        priority: it.priority,
        status: it.status,
        developer: it.developer || "Daksh",
        createdAt: it.createdAt,
      }));

      setTasks(normalized);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      alert("Failed to fetch tasks. Check backend + auth token.");
    } finally {
      setLoadingTasks(false);
    }
  };

  // ✅ Fetch users from backend
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await api.get("/api/users");
      setUsers(res.data || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      alert("Failed to fetch users. Check backend/CORS/auth.");
    } finally {
      setLoadingUsers(false);
    }
  };

  // ✅ Add user (POST /api/users)
  const handleAddUser = async () => {
    if (!newEmail || !newPassword) {
      alert("Please enter both email and password.");
      return;
    }

    try {
      await api.post("/api/users", {
        email: newEmail,
        password: newPassword,
      });

      await fetchUsers();
      setNewEmail("");
      setNewPassword("");
      alert("User added: " + newEmail);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Unknown error while adding user";
      alert("Failed to add user: " + msg);
    }
  };

  // ✅ Delete user (DELETE /api/users/:email)
  const handleDeleteUser = async (email) => {
    try {
      await api.delete(`/api/users/${encodeURIComponent(email)}`);
      await fetchUsers();
      alert("User deleted: " + email);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Unknown error while deleting user";
      alert("Failed to delete user: " + msg);
    }
  };

  // ✅ Assign developer to a task (PUT /api/backlog/:clientId)
  const handleAssignDeveloper = async (taskId, developerEmailOrName) => {
    try {
      await api.put(`/api/backlog/${encodeURIComponent(taskId)}`, {
        developer: developerEmailOrName,
      });

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, developer: developerEmailOrName } : t
        )
      );
    } catch (error) {
      console.error("Failed to assign developer:", error);
      alert("Failed to assign developer (server/auth error).");
    }
  };

  // Optional: only show devs (hide scrummaster)
  const devUsers = useMemo(() => {
    return users.filter((u) => !String(u.email || "").includes("scrummaster"));
  }, [users]);

  return (
    <div className="admin-view">
      {/* Manage Developers */}
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
        <button onClick={handleAddUser} disabled={loadingUsers}>
          {loadingUsers ? "Working..." : "Add Developer"}
        </button>
      </div>

      {/* Current Developers */}
      <h3>Current Developers</h3>
      <div className="user-list">
        {loadingUsers ? (
          <p>Loading users…</p>
        ) : (
          <table className="user-table">
            <tbody>
              {users.map((user) => (
                <tr key={user.email} className="user-row">
                  <td>{user.email}</td>
                  <td>
                    {!String(user.email).includes("scrummaster") && (
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
        )}
      </div>

      {/* Product Backlog */}
      <h2>Product Backlog</h2>

      {loadingTasks ? (
        <p>Loading backlog…</p>
      ) : (
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
                  <select
                    value={task.developer || ""}
                    onChange={(e) => handleAssignDeveloper(task.id, e.target.value)}
                  >
                    <option value="" disabled>
                      Select Developer
                    </option>

                    {/* If you store developer as name (Daksh/Chetan...) keep those */}
                    <option value="Daksh">Daksh</option>
                    <option value="Chetan">Chetan</option>
                    <option value="Gaurav">Gaurav</option>
                    <option value="Shaurya">Shaurya</option>
                    <option value="Sameeksha">Sameeksha</option>
                    <option value="Simran">Simran</option>

                    {/* Or assign by actual user emails */}
                    {devUsers.map((u) => (
                      <option key={u.email} value={u.email}>
                        {u.email}
                      </option>
                    ))}
                  </select>
                </td>

                {/* NOTE: You don’t have a "timeSpentHours" field in your Mongo schema,
                    so this input is UI-only unless you add a DB field + API update. */}
                <td>
                  <input type="number" placeholder="Hours" min="0" disabled />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: 12 }}>
        <button onClick={fetchTasks}>Refresh Backlog</button>
        <button onClick={fetchUsers} style={{ marginLeft: 8 }}>
          Refresh Users
        </button>
      </div>
    </div>
  );
}

export default AdminView;