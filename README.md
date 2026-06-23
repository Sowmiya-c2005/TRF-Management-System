# TRF Management System

> Document & Record Tracking — FastAPI · PostgreSQL · React · Vite

---

## Project Structure

```
TRF-Management-System/
├── app.py                        ← Single-command launcher (starts both servers)
├── .env                          ← Root environment variables
├── .gitignore
├── README.md
│
├── backend/
│   ├── main.py                   ← FastAPI app & router registration
│   ├── create_db.py              ← One-time DB table creation script
│   ├── requirements.txt
│   │
│   ├── api/
│   │   ├── trf_routes.py         ← TRF CRUD endpoints
│   │   ├── file_routes.py        ← File upload/download/delete endpoints
│   │   └── user_routes.py        ← Auth endpoints (register / login)
│   │
│   ├── models/
│   │   ├── trf_model.py          ← SQLAlchemy TRFRecord model
│   │   └── user_model.py         ← SQLAlchemy User model
│   │
│   ├── schemas/
│   │   ├── trf_schema.py         ← Pydantic request / response schemas
│   │   └── user_schema.py
│   │
│   ├── services/
│   │   ├── trf_service.py        ← TRF business logic
│   │   ├── file_service.py       ← File system operations
│   │   └── user_service.py       ← Auth business logic
│   │
│   └── database/
│       └── database.py           ← SQLAlchemy engine, session, Base, get_db()
│
├── frontend/
│   ├── .env                      ← VITE_API_URL
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── components/
│       │   ├── Layout.jsx
│       │   ├── Navbar.jsx
│       │   └── Sidebar.jsx
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── CreateTRF.jsx
│       │   ├── AllTRFs.jsx
│       │   ├── SearchTRF.jsx
│       │   ├── UpdateTRF.jsx
│       │   ├── UploadFile.jsx
│       │   ├── FileManager.jsx
│       │   └── Login.jsx
│       └── services/
│           ├── api.js            ← Axios instance with interceptors
│           ├── trfService.js     ← TRF API calls
│           ├── fileService.js    ← File API calls
│           └── userService.js    ← Auth API calls
│
├── uploads/                      ← TRF file storage (auto-created)
└── docs/
```

---

## Quick Start

### 1. Prerequisites

| Tool | Version |
|------|---------|
| Python | >= 3.10 |
| Node.js | >= 18 |
| PostgreSQL | >= 14 |

### 2. Clone & configure

```bash
git clone <repo-url>
cd TRF-Management-System
cp .env.example .env          # edit DATABASE_URL etc.
cp frontend/.env.example frontend/.env
```

### 3. Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
```

### 4. Create database tables

```bash
# from project root, with venv active
python -m backend.create_db
```

### 5. Frontend setup

```bash
cd frontend
npm install
```

### 6. Start everything

```bash
# from project root, with venv active
python app.py
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://127.0.0.1:8000 |
| Swagger Docs | http://127.0.0.1:8000/docs |

---

## API Reference

### TRF Endpoints (`/trfs`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/trfs/` | List all TRFs |
| GET | `/trfs/stats` | Dashboard statistics |
| GET | `/trfs/{trf_number}` | Get single TRF |
| POST | `/trfs/` | Create TRF |
| PUT | `/trfs/{trf_number}` | Update project name |
| DELETE | `/trfs/{trf_number}` | Delete TRF |

### File Endpoints (`/files`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/files/{trf}/{folder}` | List files |
| POST | `/files/{trf}/{folder}` | Upload file |
| DELETE | `/files/{trf}/{folder}/{name}` | Delete file |
| GET | `/files/{trf}/{folder}/{name}/download` | Download file |

### User Endpoints (`/users`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/users/register` | Register user |
| POST | `/users/login` | Login |

---

## Deployment

### Backend → Render

1. Create a **Web Service** on [render.com](https://render.com)
2. Build command: `pip install -r backend/requirements.txt`
3. Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables from `.env` in the Render dashboard
5. Add a **PostgreSQL** database and update `DATABASE_URL`

### Frontend → Vercel

1. Import the repo on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variable: `VITE_API_URL=https://your-render-api.onrender.com`

---

## Roadmap

- [ ] JWT-based authentication
- [ ] Role-based access control (Admin / Engineer / Viewer)
- [ ] File preview in browser
- [ ] Email notifications on TRF creation
- [ ] Audit log / activity history
