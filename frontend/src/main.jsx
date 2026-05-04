import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

// ✅ FIXED API URL (IMPORTANT)
const API_URL = "https://team-task-manager-production-c7e5.up.railway.app/api";

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

  const isAdmin = user?.role === 'ADMIN';

  const userMap = useMemo(() => new Map(users.map((item) => [item.id, item])), [users]);
  const projectMap = useMemo(() => new Map(projects.map((item) => [item.id, item])), [projects]);

  // ✅ API helper
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
      throw new Error(data?.detail || 'Request failed');
    }

    return data;
  }

  // ✅ Load data
  async function loadData(activeToken = token) {
    if (!activeToken) return;

    const headers = { Authorization: `Bearer ${activeToken}` };

    const fetchWithToken = async (path) => {
      const res = await fetch(`${API_URL}${path}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || 'Error');
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

  // ✅ Login
  async function handleLogin(e) {
    e.preventDefault();
    setMessage('');
    try {
      const data = await api('/login/', {
        method: 'POST',
        body: JSON.stringify(login),
      });
      localStorage.setItem('token', data.access);
      setToken(data.access);
      await loadData(data.access);
    } catch (err) {
      setMessage(err.message);
    }
  }

  // ✅ Signup
  async function handleSignup(e) {
    e.preventDefault();
    setMessage('');
    try {
      await api('/signup/', {
        method: 'POST',
        body: JSON.stringify(signup),
      });
      setAuthMode('login');
      setMessage('Account created. Login now.');
    } catch (err) {
      setMessage(err.message);
    }
  }

  function logout() {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  }

  // 🔐 Auth UI
  if (!token || !user) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <h1>Team Task Manager</h1>

          <div className="tabs">
            <button onClick={() => setAuthMode('login')}>Login</button>
            <button onClick={() => setAuthMode('signup')}>Signup</button>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleLogin}>
              <input placeholder="Username" onChange={(e) => setLogin({ ...login, username: e.target.value })} required />
              <input type="password" placeholder="Password" onChange={(e) => setLogin({ ...login, password: e.target.value })} required />
              <button type="submit">Login</button>
            </form>
          ) : (
            <form onSubmit={handleSignup}>
              <input placeholder="Username" onChange={(e) => setSignup({ ...signup, username: e.target.value })} required />
              <input placeholder="Email" onChange={(e) => setSignup({ ...signup, email: e.target.value })} />
              <input type="password" placeholder="Password" onChange={(e) => setSignup({ ...signup, password: e.target.value })} required />
              <button type="submit">Signup</button>
            </form>
          )}

          {message && <p style={{ color: 'red' }}>{message}</p>}
        </section>
      </main>
    );
  }

  // ✅ Dashboard
  return (
    <main>
      <h1>Dashboard Loaded Successfully 🎉</h1>
      <p>Welcome {user.username}</p>
      <button onClick={logout}>Logout</button>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);