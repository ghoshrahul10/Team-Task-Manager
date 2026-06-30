Team Task Manager

Full-stack assignment project where users can create projects, assign tasks, and track progress with role-based access control.

Features:
- Signup and login with JWT authentication
- Admin and Member roles
- Project creation with team members
- Task creation, assignment, due date, and status tracking
- Dashboard with total, todo, in-progress, done, and overdue task counts
- REST APIs with Django REST Framework
- SQL database support using SQLite locally and PostgreSQL on Railway
- React frontend for the user interface

Tech Stack:
- Backend: Django, Django REST Framework, SimpleJWT
- Frontend: React, Vite
- Database: SQLite for local development, PostgreSQL for Railway deployment
- Deployment: Railway, Docker, Gunicorn, WhiteNoise

Local Setup:
1. Start backend:
   cd backend
   .\venv\Scripts\activate
   python manage.py runserver

2. Start frontend:
   cd frontend
   npm.cmd install
   npm.cmd run dev -- --host 127.0.0.1 --port 5175

3. Open:
   http://127.0.0.1:5175/

Default API Endpoints:
- POST /signup/
- POST /login/
- POST /refresh/
- GET /me/
- GET /users/
- GET/POST /projects/
- GET/POST /tasks/
- GET/PATCH/DELETE /tasks/<id>/
- GET /dashboard/

Role Rules:
- Admin users can create projects and tasks.
- Member users can view assigned/relevant tasks and update task status.
- Tasks can only be assigned to users who belong to the selected project.

Railway Deployment:
1. Push the project to GitHub.
2. Create a new Railway project from the GitHub repository.
3. Add a PostgreSQL database service in Railway.
4. Ensure the web service has DATABASE_URL from the PostgreSQL service.
5. Add these environment variables:
   DEBUG=False
   SECRET_KEY=<any strong random secret>
6. Railway will use the Dockerfile to build the React frontend and Django backend together.
7. Generate a public domain for the web service.
8. Open the Railway public URL and test signup/login/project/task/dashboard flows.
