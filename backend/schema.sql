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
