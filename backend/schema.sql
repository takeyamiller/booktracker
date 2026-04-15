CREATE TABLE IF NOT EXISTS books (
    id            INT PRIMARY KEY AUTO_INCREMENT,
    title         VARCHAR(255) NOT NULL,
    author        VARCHAR(255) NOT NULL,
    genre         VARCHAR(100),
    cover_url     TEXT,
    status        VARCHAR(20) NOT NULL DEFAULT 'want_to_read',
    rating        INT,
    notes         TEXT,
    finished_date VARCHAR(20)
);
