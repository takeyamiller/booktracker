# CLAUDE.md

## What This Project Does

Book Tracker is a personal reading list app. A single user can track books they want to read, are currently reading, or have finished. Each book stores a title, author, genre, cover image URL, status, rating, notes, and date finished.

See `docs/` for the full design:
- [Project Proposal](docs/project-proposal.md)
- [Architecture](docs/architecture.md)
- [Database Schema](docs/database-schema.md)

---

## Folder Structure

```
booktracker/
├── backend/              Go API server
│   ├── main.go           All routes and handlers
│   ├── schema.sql        Database schema
│   └── db/               sqlc-generated Go code (do not edit manually)
│
├── frontend/             React frontend (Vite)
│   └── src/
│       ├── App.jsx       Router and layout
│       ├── pages/        One file per page
│       ├── components/   Shared UI components
│       └── lib/
│           ├── api.js    All fetch calls to the backend
│           ├── queries.js TanStack Query hooks
│           └── auth.js   JWT token helpers
│
├── docs/                 Design and planning documents
├── README.md
└── CLAUDE.md
```

---

## How to Run

**Backend**
```bash
cd backend
go run main.go
# http://localhost:8080
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

---

## Architectural Decisions

- **Single-user** — one admin password, no user accounts or registration
- **Flat schema** — one `books` table with all fields; no join tables needed
- **Go + SQLite** — simple stack, no external database, single binary deployment
- **JWT auth** — token stored in localStorage, expires after 24 hours
- **All API calls go through `lib/api.js`** — never call fetch directly in a component
- **TanStack Query** — all data fetching uses useQuery/useMutation hooks in `lib/queries.js`; always invalidate the relevant query key on mutation success
- **Tailwind CSS** — utility-first styling, no component library
