# Book Tracker

A personal reading list app. Track books you want to read, are currently reading, or have finished — with ratings, notes, and the date you finished each one.

---

## What It Does

- Add books with title, author, genre, and cover image
- Track reading status: Want to Read / Currently Reading / Finished
- Add a rating (1–5) and personal notes when you finish a book
- Record the date you finished a book
- Filter your list by status

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS, TanStack Query |
| Backend | Go (stdlib net/http) |
| Database | SQLite |
| Auth | JWT (single admin password) |

---

## Prerequisites

- [Go](https://go.dev/dl/) 1.21 or later
- [Node.js](https://nodejs.org/) 18 or later

---

## Running Locally

**Terminal 1 — Backend**
```bash
cd backend
go run main.go
# Runs on http://localhost:8080
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_PATH` | `./booktracker.db` | Path to the SQLite database file |
| `JWT_SECRET` | `dev-secret-change-in-production` | Secret used to sign auth tokens |
| `ADMIN_PASSWORD` | `admin` | Password for the login page |

---

## Project Structure

```
booktracker/
├── backend/       Go API server
├── frontend/      React frontend
├── docs/          Project planning and design docs
└── README.md
```

## Docs

- [Project Proposal](docs/project-proposal.md) — what the app does and why
- [Architecture](docs/architecture.md) — pages, navigation, and API design
- [Database Schema](docs/database-schema.md) — tables and relationships
