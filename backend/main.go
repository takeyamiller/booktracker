package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	_ "github.com/mattn/go-sqlite3"
)

var conn *sql.DB
var jwtSecret []byte

type BookResponse struct {
	ID           int    `json:"id"`
	Title        string `json:"title"`
	Author       string `json:"author"`
	Genre        string `json:"genre"`
	CoverURL     string `json:"coverUrl"`
	Status       string `json:"status"`
	Rating       int    `json:"rating"`
	Notes        string `json:"notes"`
	FinishedDate string `json:"finishedDate"`
}

func main() {
	dbPath := os.Getenv("DATABASE_PATH")
	if dbPath == "" {
		dbPath = "./booktracker.db"
	}

	var err error
	conn, err = sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	if err = conn.Ping(); err != nil {
		log.Fatal("Cannot connect to database:", err)
	}
	log.Println("Connected to SQLite")

	_, err = conn.Exec(`CREATE TABLE IF NOT EXISTS books (
		id            INTEGER PRIMARY KEY AUTOINCREMENT,
		title         TEXT NOT NULL,
		author        TEXT NOT NULL,
		genre         TEXT,
		cover_url     TEXT,
		status        TEXT NOT NULL DEFAULT 'want_to_read',
		rating        INTEGER,
		notes         TEXT,
		finished_date TEXT
	)`)
	if err != nil {
		log.Fatal("Failed to create books table:", err)
	}

	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "dev-secret-change-in-production"
		log.Println("Warning: JWT_SECRET not set, using default (not safe for production)")
	}
	jwtSecret = []byte(secret)

	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/api/login", loginHandler)
	http.HandleFunc("/api/books", booksHandler)
	http.HandleFunc("/api/books/", bookByIDHandler)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}
	log.Println("Server starting on :" + port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal(err)
	}
}

func withCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
}

func requireAuth(w http.ResponseWriter, r *http.Request) bool {
	authHeader := r.Header.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return false
	}
	tokenStr := authHeader[len("Bearer "):]
	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return jwtSecret, nil
	})
	if err != nil || !token.Valid {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return false
	}
	return true
}

func scanBook(row *sql.Row) (BookResponse, error) {
	var b BookResponse
	var genre, coverURL, notes, finishedDate sql.NullString
	var rating sql.NullInt64
	err := row.Scan(&b.ID, &b.Title, &b.Author, &genre, &coverURL, &b.Status, &rating, &notes, &finishedDate)
	if err != nil {
		return b, err
	}
	b.Genre = genre.String
	b.CoverURL = coverURL.String
	b.Notes = notes.String
	b.FinishedDate = finishedDate.String
	b.Rating = int(rating.Int64)
	return b, nil
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	withCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var body struct {
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	adminPassword := os.Getenv("ADMIN_PASSWORD")
	if adminPassword == "" {
		adminPassword = "admin"
		log.Println("Warning: ADMIN_PASSWORD not set, using default")
	}

	if body.Password != adminPassword {
		http.Error(w, "Invalid password", http.StatusUnauthorized)
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"role": "admin",
		"exp":  time.Now().Add(24 * time.Hour).Unix(),
		"iat":  time.Now().Unix(),
	})
	signed, err := token.SignedString(jwtSecret)
	if err != nil {
		http.Error(w, "Could not generate token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"token": signed})
}

// booksHandler handles GET /api/books and POST /api/books
func booksHandler(w http.ResponseWriter, r *http.Request) {
	withCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	ctx := context.Background()

	switch r.Method {
	case http.MethodGet:
		if !requireAuth(w, r) {
			return
		}
		status := r.URL.Query().Get("status")

		var rows *sql.Rows
		var err error
		if status != "" {
			rows, err = conn.QueryContext(ctx,
				`SELECT id, title, author, genre, cover_url, status, rating, notes, finished_date FROM books WHERE status = ? ORDER BY id DESC`,
				status,
			)
		} else {
			rows, err = conn.QueryContext(ctx,
				`SELECT id, title, author, genre, cover_url, status, rating, notes, finished_date FROM books ORDER BY id DESC`,
			)
		}
		if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			log.Println("Query error:", err)
			return
		}
		defer rows.Close()

		response := []BookResponse{}
		for rows.Next() {
			var b BookResponse
			var genre, coverURL, notes, finishedDate sql.NullString
			var rating sql.NullInt64
			if err := rows.Scan(&b.ID, &b.Title, &b.Author, &genre, &coverURL, &b.Status, &rating, &notes, &finishedDate); err != nil {
				http.Error(w, "Database error", http.StatusInternalServerError)
				log.Println("Scan error:", err)
				return
			}
			b.Genre = genre.String
			b.CoverURL = coverURL.String
			b.Notes = notes.String
			b.FinishedDate = finishedDate.String
			b.Rating = int(rating.Int64)
			response = append(response, b)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)

	case http.MethodPost:
		if !requireAuth(w, r) {
			return
		}
		var input struct {
			Title        string `json:"title"`
			Author       string `json:"author"`
			Genre        string `json:"genre"`
			CoverURL     string `json:"coverUrl"`
			Status       string `json:"status"`
			Rating       int    `json:"rating"`
			Notes        string `json:"notes"`
			FinishedDate string `json:"finishedDate"`
		}
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}
		if strings.TrimSpace(input.Title) == "" || strings.TrimSpace(input.Author) == "" {
			http.Error(w, "title and author are required", http.StatusBadRequest)
			return
		}
		validStatuses := map[string]bool{"want_to_read": true, "reading": true, "finished": true}
		if input.Status == "" {
			input.Status = "want_to_read"
		}
		if !validStatuses[input.Status] {
			http.Error(w, "status must be want_to_read, reading, or finished", http.StatusBadRequest)
			return
		}

		result, err := conn.ExecContext(ctx,
			`INSERT INTO books (title, author, genre, cover_url, status, rating, notes, finished_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			input.Title,
			input.Author,
			sql.NullString{String: input.Genre, Valid: input.Genre != ""},
			sql.NullString{String: input.CoverURL, Valid: input.CoverURL != ""},
			input.Status,
			sql.NullInt64{Int64: int64(input.Rating), Valid: input.Rating > 0},
			sql.NullString{String: input.Notes, Valid: input.Notes != ""},
			sql.NullString{String: input.FinishedDate, Valid: input.FinishedDate != ""},
		)
		if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			log.Println("Insert error:", err)
			return
		}
		id, _ := result.LastInsertId()
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(BookResponse{
			ID:           int(id),
			Title:        input.Title,
			Author:       input.Author,
			Genre:        input.Genre,
			CoverURL:     input.CoverURL,
			Status:       input.Status,
			Rating:       input.Rating,
			Notes:        input.Notes,
			FinishedDate: input.FinishedDate,
		})

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// bookByIDHandler handles GET /api/books/:id, PUT /api/books/:id, DELETE /api/books/:id
func bookByIDHandler(w http.ResponseWriter, r *http.Request) {
	withCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	idStr := r.URL.Path[len("/api/books/"):]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid book ID", http.StatusBadRequest)
		return
	}

	ctx := context.Background()

	switch r.Method {
	case http.MethodGet:
		if !requireAuth(w, r) {
			return
		}
		row := conn.QueryRowContext(ctx,
			`SELECT id, title, author, genre, cover_url, status, rating, notes, finished_date FROM books WHERE id = ?`, id,
		)
		b, err := scanBook(row)
		if err == sql.ErrNoRows {
			http.Error(w, "Book not found", http.StatusNotFound)
			return
		}
		if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(b)

	case http.MethodPut:
		if !requireAuth(w, r) {
			return
		}
		var input struct {
			Title        string `json:"title"`
			Author       string `json:"author"`
			Genre        string `json:"genre"`
			CoverURL     string `json:"coverUrl"`
			Status       string `json:"status"`
			Rating       int    `json:"rating"`
			Notes        string `json:"notes"`
			FinishedDate string `json:"finishedDate"`
		}
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}
		if strings.TrimSpace(input.Title) == "" || strings.TrimSpace(input.Author) == "" {
			http.Error(w, "title and author are required", http.StatusBadRequest)
			return
		}
		validStatuses := map[string]bool{"want_to_read": true, "reading": true, "finished": true}
		if !validStatuses[input.Status] {
			http.Error(w, "status must be want_to_read, reading, or finished", http.StatusBadRequest)
			return
		}

		res, err := conn.ExecContext(ctx,
			`UPDATE books SET title=?, author=?, genre=?, cover_url=?, status=?, rating=?, notes=?, finished_date=? WHERE id=?`,
			input.Title,
			input.Author,
			sql.NullString{String: input.Genre, Valid: input.Genre != ""},
			sql.NullString{String: input.CoverURL, Valid: input.CoverURL != ""},
			input.Status,
			sql.NullInt64{Int64: int64(input.Rating), Valid: input.Rating > 0},
			sql.NullString{String: input.Notes, Valid: input.Notes != ""},
			sql.NullString{String: input.FinishedDate, Valid: input.FinishedDate != ""},
			id,
		)
		if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			log.Println("Update error:", err)
			return
		}
		rows, _ := res.RowsAffected()
		if rows == 0 {
			http.Error(w, "Book not found", http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(BookResponse{
			ID:           id,
			Title:        input.Title,
			Author:       input.Author,
			Genre:        input.Genre,
			CoverURL:     input.CoverURL,
			Status:       input.Status,
			Rating:       input.Rating,
			Notes:        input.Notes,
			FinishedDate: input.FinishedDate,
		})

	case http.MethodDelete:
		if !requireAuth(w, r) {
			return
		}
		res, err := conn.ExecContext(ctx, `DELETE FROM books WHERE id=?`, id)
		if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			log.Println("Delete error:", err)
			return
		}
		rows, _ := res.RowsAffected()
		if rows == 0 {
			http.Error(w, "Book not found", http.StatusNotFound)
			return
		}
		w.WriteHeader(http.StatusNoContent)

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}
