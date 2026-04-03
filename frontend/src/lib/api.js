import { getToken } from './auth'

async function apiFetch(url, options = {}) {
  const res = await fetch(url, options)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text.trim() || `${res.status} ${res.statusText}`)
  }
  if (res.status === 204) return null
  return res.json()
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  }
}

export const api = {
  login: (password) =>
    apiFetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) }),

  books: (status) =>
    apiFetch(`/api/books${status ? `?status=${status}` : ''}`, { headers: authHeaders() }),
  book: (id) =>
    apiFetch(`/api/books/${id}`, { headers: authHeaders() }),
  createBook: (data) =>
    apiFetch('/api/books', { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }),
  updateBook: (id, data) =>
    apiFetch(`/api/books/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) }),
  deleteBook: (id) =>
    apiFetch(`/api/books/${id}`, { method: 'DELETE', headers: authHeaders() }),
}
