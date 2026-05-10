import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

// ✅ Railway API URL
const API_URL = import.meta.env.VITE_API_URL;

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

  const [login, setLogin] = useState({
    username: '',
    password: '',
  });

  const [signup, setSignup] = useState({
    username: '',
    email: '',
    password: '',
    role: 'MEMBER',
  });

  const isAdmin = user?.role === 'ADMIN';

  const userMap = useMemo(
    () => new Map(users.map((item) => [item.id, item])),
    [users]
  );

  const projectMap = useMemo(
    () => new Map(projects.map((item) => [item.id, item])),
    [projects]
  );

  // ✅ API helper
  async function api(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token
          ? { Authorization: `Bearer ${token}` }
          : {}),
        ...(options.headers || {}),
      },
    });

    const text = await response.text();

    let data = null;

    try {
      data = text ? JSON.parse(text) : null;
    } catch (error) {
      throw new Error('Backend returned invalid JSON response');
    }

    if (!response.ok) {
      throw new Error(
        data?.detail ||
        data?.message ||
        'Request failed'
      );
    }

    return data;
  }

  // ✅ Load dashboard data
  async function loadData(activeToken = token) {
    if (!activeToken) return;

    const headers = {
      Authorization: `Bearer ${activeToken}`,
    };

    const fetchWithToken = async (path) => {
      const response = await fetch(
        `${API_URL}${path}`,
        { headers }
      );

      const text = await response.text();

      let data = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch (error) {
        throw new Error(
          'Invalid JSON returned from backend'
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.detail || 'Error fetching data'
        );
      }

      return data;
    };

    const [
      me,
      allUsers,
      allProjects,
      allTasks,
      stats,
    ] = await Promise.all([
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

  // ✅ Auto load if token exists
  useEffect(() => {
    if (token) {
      loadData().catch((error) => {
        console.error(error);
        localStorage.removeItem('token');
        setToken('');
        setUser(null);
      });
    }
  }, []);

  // ✅ Login
  async function handleLogin(event) {
    event.preventDefault();

    setMessage('');

    try {
      const data = await api('/login/', {
        method: 'POST',
        body: JSON.stringify(login),
      });

      localStorage.setItem(
        'token',
        data.access
      );

      setToken(data.access);

      await loadData(data.access);

      setMessage('Login successful ✅');

    } catch (error) {
      setMessage(error.message);
    }
  }

  // ✅ Signup
  async function handleSignup(event) {
    event.preventDefault();

    setMessage('');

    try {
      await api('/signup/', {
        method: 'POST',
        body: JSON.stringify(signup),
      });

      setAuthMode('login');

      setMessage(
        'Account created successfully. Please login.'
      );

    } catch (error) {
      setMessage(error.message);
    }
  }

  // ✅ Logout
  function logout() {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  }

  // ✅ AUTH SCREEN
  if (!token || !user) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <h1>Team Task Manager</h1>

          <p className="muted">
            Login or create account
          </p>

          <div className="tabs">
            <button
              className={
                authMode === 'login'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setAuthMode('login')
              }
            >
              Login
            </button>

            <button
              className={
                authMode === 'signup'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setAuthMode('signup')
              }
            >
              Signup
            </button>
          </div>

          {authMode === 'login' ? (
            <form
              className="form"
              onSubmit={handleLogin}
            >
              <input
                type="text"
                placeholder="Username"
                value={login.username}
                onChange={(e) =>
                  setLogin({
                    ...login,
                    username: e.target.value,
                  })
                }
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={login.password}
                onChange={(e) =>
                  setLogin({
                    ...login,
                    password: e.target.value,
                  })
                }
                required
              />

              <button type="submit">
                Login
              </button>
            </form>
          ) : (
            <form
              className="form"
              onSubmit={handleSignup}
            >
              <input
                type="text"
                placeholder="Username"
                value={signup.username}
                onChange={(e) =>
                  setSignup({
                    ...signup,
                    username: e.target.value,
                  })
                }
                required
              />

              <input
                type="email"
                placeholder="Email"
                value={signup.email}
                onChange={(e) =>
                  setSignup({
                    ...signup,
                    email: e.target.value,
                  })
                }
              />

              <input
                type="password"
                placeholder="Password"
                value={signup.password}
                onChange={(e) =>
                  setSignup({
                    ...signup,
                    password: e.target.value,
                  })
                }
                required
              />

              <select
                value={signup.role}
                onChange={(e) =>
                  setSignup({
                    ...signup,
                    role: e.target.value,
                  })
                }
              >
                <option value="MEMBER">
                  Member
                </option>

                <option value="ADMIN">
                  Admin
                </option>
              </select>

              <button type="submit">
                Signup
              </button>
            </form>
          )}

          {message && (
            <p
              style={{
                color: 'red',
                marginTop: '10px',
              }}
            >
              {message}
            </p>
          )}
        </section>
      </main>
    );
  }

  // ✅ DASHBOARD
  return (
    <main className="app">
      <header className="topbar">
        <div>
          <h1>Team Task Manager</h1>

          <p className="muted">
            Welcome {user.username}
          </p>
        </div>

        <button
          className="secondary"
          onClick={logout}
        >
          Logout
        </button>
      </header>

      <section className="stats">
        <div className="stat">
          <span>Total Tasks</span>
          <strong>
            {dashboard?.total_tasks || 0}
          </strong>
        </div>

        <div className="stat">
          <span>Todo</span>
          <strong>
            {dashboard?.todo || 0}
          </strong>
        </div>

        <div className="stat">
          <span>In Progress</span>
          <strong>
            {dashboard?.in_progress || 0}
          </strong>
        </div>

        <div className="stat">
          <span>Done</span>
          <strong>
            {dashboard?.done || 0}
          </strong>
        </div>
      </section>

      <section className="card">
        <h2>Projects</h2>

        {projects.length ? (
          projects.map((project) => (
            <div
              key={project.id}
              className="row"
            >
              <strong>
                {project.name}
              </strong>
            </div>
          ))
        ) : (
          <p>No projects found.</p>
        )}
      </section>

      <section className="card">
        <h2>Tasks</h2>

        {tasks.length ? (
          tasks.map((task) => (
            <div
              key={task.id}
              className="task"
            >
              <strong>
                {task.title}
              </strong>

              <p>
                Status: {task.status}
              </p>
            </div>
          ))
        ) : (
          <p>No tasks found.</p>
        )}
      </section>
    </main>
  );
}

createRoot(
  document.getElementById('root')
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);