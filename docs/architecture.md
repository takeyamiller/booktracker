# Architecture

## Pages

**Book List (`/`)**
Purpose: Show all your books, filterable by status. The home base of the app.
How users arrive: Direct — it's the default landing page.

**Book Detail (`/books/:id`)**
Purpose: Show everything about one book and let you edit or delete it.
How users arrive: Clicking a book card on the Book List.

**Login (`/login`)**
Purpose: Authenticate before making any changes to your books.
How users arrive: Redirect when trying to add/edit/delete without being logged in, or direct link.

**Add / Edit Book (modal on `/`)**
Purpose: Single form for creating a new book or updating an existing one.
How users arrive: "Add Book" button on the Book List, or "Edit" on the Book Detail page.

---

## Navigation Flow

```
[Login (/login)]
        |
        | success
        v
[Book List (/)]
        |
        |-- click book ---------> [Book Detail (/books/:id)]
        |                                   |
        |-- "Add Book" button               |-- "Edit" --> [Add/Edit Modal]
                |                           |
                v                           |-- "Delete" --> back to [Book List (/)]
         [Add/Edit Modal]
                |
                | save
                v
         [Book List (/)]
```

---

## API Design

Token stored in localStorage. All endpoints except login require a Bearer token.

```
AUTH
────────────────────────────────────────────────
POST   /api/login               Get token (password-based, single user)

BOOKS
────────────────────────────────────────────────
GET    /api/books               List all books
POST   /api/books               Add a new book (auth required)
GET    /api/books/:id           Get a single book (auth required)
PUT    /api/books/:id           Update a book — status, rating, notes, etc. (auth required)
DELETE /api/books/:id           Delete a book (auth required)
```

### Notes
- All `/api/books` write endpoints require a valid Bearer token
- `rating` and `finished_date` should only be set when status is `finished`
- `GET /api/books` should support an optional `?status=` query param for filtering
