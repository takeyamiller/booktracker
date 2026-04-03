# Database Schema

## Design Decisions

- Single-user app — no `users` table or join table needed
- One flat `books` table holds everything: metadata, tracking status, and personal notes
- `rating` and `finished_date` are optional and only meaningful when `status = "finished"`

---

## Tables

### books

| Column | Type | Required | Notes |
|---|---|---|---|
| `id` | integer | yes | Primary key, auto-increment |
| `title` | text | yes | |
| `author` | text | yes | |
| `genre` | text | no | Free text, user-defined |
| `cover_url` | text | no | URL to a cover image |
| `status` | text | yes | One of: `want_to_read`, `reading`, `finished` |
| `rating` | integer | no | 1–5, only set when status is `finished` |
| `notes` | text | no | Personal notes, any status |
| `finished_date` | text | no | ISO date string, only set when status is `finished` |

---

## SQL

```sql
CREATE TABLE IF NOT EXISTS books (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    title         TEXT NOT NULL,
    author        TEXT NOT NULL,
    genre         TEXT,
    cover_url     TEXT,
    status        TEXT NOT NULL DEFAULT 'want_to_read',
    rating        INTEGER,
    notes         TEXT,
    finished_date TEXT
);
```

---

## Status Values

| Value | Meaning |
|---|---|
| `want_to_read` | On the reading list, not started |
| `reading` | Currently in progress |
| `finished` | Completed — rating and finished_date can be set |
