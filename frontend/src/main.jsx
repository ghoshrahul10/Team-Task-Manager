import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://team-task-manager-production-c7e5.up.railway.app/api/';

const statuses = [
  ['TODO', 'Todo'],
  ['IN_PROGRESS', 'In Progress'],
  ['DONE', 'Done'],
];

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [message, setMessage] = useState('');
  const [authMode, setAuthMode] = useState('login');
  const [login, setLogin] = useState({ username: '', password: '' });
  const [signup, setSignup] = useState({ username: '', email: '', password: '', role: 'MEMBER' });
  const [projectForm, setProjectForm] = useState({ name: '', members: [] });
  const [taskForm, setTaskForm] = useState({
    title: '',
    project: '',
    assigned_to: '',
    status: 'TODO',
    due_date: '',
  });

  const isAdmin = user?.role === 'ADMIN';

  const userMap = useMemo(() => new Map(users.map((item) => [item.id, item])), [users]);
  const projectMap = useMemo(() => new Map(projects.map((item) => [item.id, item])), [projects]);

  const selectedProject = projects.find((item) => String(item.id) === String(taskForm.project));
  const taskMembers = selectedProject
    ? users.filter((item) => selectedProject.members.includes(item.id))
    : users;

  async function api(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
      throw new Error(formatError(data));
    }
    return data;
  }

  function formatError(data) {
    if (!data) return 'Request failed';
    if (data.detail) return data.detail;
    return Object.entries(data)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
      .join(' ');
  }

  async function loadData(activeToken = token) {
    if (!activeToken) return;
    const headers = { Authorization: `Bearer ${activeToken}` };
    const fetchWithToken = async (path) => {
      const response = await fetch(`${API_URL}${path}`, { headers });
      const data = await response.json();
      if (!response.ok) throw new Error(formatError(data));
      return data;
    };

    const [me, allUsers, allProjects, allTasks, stats] = await Promise.all([
      fetchWithToken('/me/'),
      fetchWithToken('/users/'),
      fetchWithToken('/projects/'),
      fetchWithToken('/tasks/'),
      fetchWithToken('/dashboard/'),
    ]);

    setUser(me);
    setUsers(allUsers);
    setProjects(allProjects);
    setTasks(allTasks);
    setDashboard(stats);
    setTaskForm((current) => ({
      ...current,
      project: current.project || allProjects[0]?.id || '',
      assigned_to: current.assigned_to || allUsers[0]?.id || '',
    }));
  }

  useEffect(() => {
    if (token) {
      loadData().catch(() => {
        localStorage.removeItem('token');
        setToken('');
        setUser(null);
      });
    }
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    setMessage('');
    try {
      const data = await api('/login/', {
        method: 'POST',
        body: JSON.stringify(login),
      });
      localStorage.setItem('token', data.access);
      setToken(data.access);
      await loadData(data.access);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function handleSignup(event) {
    event.preventDefault();
    setMessage('');
    try {
      await api('/signup/', {
        method: 'POST',
        body: JSON.stringify(signup),
      });
      setAuthMode('login');
      setMessage('Account created. Login now.');
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function createProject(event) {
    event.preventDefault();
    setMessage('');
    try {
      const members = Array.from(new Set([...projectForm.members.map(Number), user.id]));
      await api('/projects/', {
        method: 'POST',
        body: JSON.stringify({ name: projectForm.name, members }),
      });
      setProjectForm({ name: '', members: [] });
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function createTask(event) {
    event.preventDefault();
    setMessage('');
    try {
      await api('/tasks/', {
        method: 'POST',
        body: JSON.stringify({
          ...taskForm,
          project: Number(taskForm.project),
          assigned_to: Number(taskForm.assigned_to),
          due_date: taskForm.due_date || null,
        }),
      });
      setTaskForm((current) => ({ ...current, title: '', status: 'TODO', due_date: '' }));
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function updateStatus(taskId, status) {
    setMessage('');
    try {
      await api(`/tasks/${taskId}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await loadData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function logout() {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  }

  if (!token || !user) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <h1>Team Task Manager</h1>
          <p className="muted">Login or create an account to continue.</p>

          <div className="tabs">
            <button className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>Login</button>
            <button className={authMode === 'signup' ? 'active' : ''} onClick={() => setAuthMode('signup')}>Signup</button>
          </div>

          {authMode === 'login' ? (
            <form className="form" onSubmit={handleLogin}>
              <label>Username
                <input value={login.username} onChange={(e) => setLogin({ ...login, username: e.target.value })} required />
              </label>
              <label>Password
                <input type="password" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} required />
              </label>
              <button type="submit">Login</button>
            </form>
          ) : (
            <form className="form" onSubmit={handleSignup}>
              <label>Username
                <input value={signup.username} onChange={(e) => setSignup({ ...signup, username: e.target.value })} required />
              </label>
              <label>Email
                <input type="email" value={signup.email} onChange={(e) => setSignup({ ...signup, email: e.target.value })} />
              </label>
              <label>Password
                <input type="password" value={signup.password} onChange={(e) => setSignup({ ...signup, password: e.target.value })} required />
              </label>
              <label>Role
                <select value={signup.role} onChange={(e) => setSignup({ ...signup, role: e.target.value })}>
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </label>
              <button type="submit">Create Account</button>
            </form>
          )}

          {message && <p className="message">{message}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="app">
      <header className="topbar">
        <div>
          <h1>Team Task Manager</h1>
          <p className="muted">Signed in as {user.username} ({user.role})</p>
        </div>
        <button className="secondary" onClick={logout}>Logout</button>
      </header>

      <section className="stats">
        <Stat label="Total Tasks" value={dashboard?.total_tasks || 0} />
        <Stat label="Todo" value={dashboard?.todo || 0} />
        <Stat label="In Progress" value={dashboard?.in_progress || 0} />
        <Stat label="Done" value={dashboard?.done || 0} />
        <Stat label="Overdue" value={dashboard?.overdue || 0} />
      </section>

      {message && <p className="banner">{message}</p>}

      <section className="layout">
        <aside className="forms">
          {isAdmin ? (
            <>
              <form className="card form" onSubmit={createProject}>
                <h2>Create Project</h2>
                <label>Name
                  <input value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} required />
                </label>
                <label>Members
                  <select
                    multiple
                    size="5"
                    value={projectForm.members}
                    onChange={(e) => setProjectForm({
                      ...projectForm,
                      members: Array.from(e.target.selectedOptions, (item) => item.value),
                    })}
                  >
                    {users.map((item) => <option key={item.id} value={item.id}>{item.username} ({item.role})</option>)}
                  </select>
                </label>
                <button type="submit">Create Project</button>
              </form>

              <form className="card form" onSubmit={createTask}>
                <h2>Create Task</h2>
                <label>Title
                  <input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required />
                </label>
                <label>Project
                  <select value={taskForm.project} onChange={(e) => setTaskForm({ ...taskForm, project: e.target.value, assigned_to: '' })} required>
                    <option value="">Select project</option>
                    {projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </label>
                <label>Assign To
                  <select value={taskForm.assigned_to} onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })} required>
                    <option value="">Select user</option>
                    {taskMembers.map((item) => <option key={item.id} value={item.id}>{item.username}</option>)}
                  </select>
                </label>
                <label>Status
                  <select value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}>
                    {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label>Due Date
                  <input type="date" value={taskForm.due_date} onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })} />
                </label>
                <button type="submit" disabled={!projects.length}>Create Task</button>
              </form>
            </>
          ) : (
            <section className="card">
              <h2>Member View</h2>
              <p className="muted">You can view assigned tasks and update their status.</p>
            </section>
          )}
        </aside>

        <section className="content">
          <section className="card">
            <h2>Projects</h2>
            <div className="list">
              {projects.length ? projects.map((item) => (
                <article className="row" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <p className="muted">Created by {item.created_by}</p>
                  </div>
                  <span>{item.members.length} members</span>
                </article>
              )) : <p className="muted">No projects yet.</p>}
            </div>
          </section>

          <section className="card">
            <h2>Tasks</h2>
            <div className="list">
              {tasks.length ? tasks.map((task) => (
                <article className="task" key={task.id}>
                  <div>
                    <strong>{task.title}</strong>
                    <p className="muted">
                      {projectMap.get(task.project)?.name || `Project #${task.project}`} · Assigned to {userMap.get(task.assigned_to)?.username || task.assigned_to}
                      {task.due_date ? ` · Due ${task.due_date}` : ''}
                    </p>
                  </div>
                  <span className={`status ${task.status}`}>{task.status.replace('_', ' ')}</span>
                  <div className="actions">
                    {statuses.map(([value, label]) => (
                      <button
                        key={value}
                        className="secondary"
                        disabled={task.status === value}
                        onClick={() => updateStatus(task.id, value)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </article>
              )) : <p className="muted">No tasks yet.</p>}
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <article className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
