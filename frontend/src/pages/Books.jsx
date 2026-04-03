import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, BookOpen, LogOut, AlertTriangle, Trash2 } from 'lucide-react'
import { useBooks, useCreateBook, useUpdateBook, useDeleteBook } from '@/lib/queries'
import { clearToken } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Modal } from '@/components/ui/modal'
import { cn } from '@/lib/utils'

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'want_to_read', label: 'Want to Read' },
  { value: 'reading', label: 'Reading' },
  { value: 'finished', label: 'Finished' },
]

const STATUS_BADGE = {
  want_to_read: { label: 'Want to Read', variant: 'outline' },
  reading: { label: 'Reading', variant: 'warning' },
  finished: { label: 'Finished', variant: 'success' },
}

const EMPTY_FORM = { title: '', author: '', genre: '', coverUrl: '', status: 'want_to_read', rating: '', notes: '', finishedDate: '' }

const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 bg-white'

export default function Books() {
  const navigate = useNavigate()
  const [activeStatus, setActiveStatus] = useState('')
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data: books = [], isLoading, error, refetch } = useBooks(activeStatus || undefined)

  const createMutation = useCreateBook({ onSuccess: closeForm })
  const updateMutation = useUpdateBook({ onSuccess: closeForm })
  const deleteMutation = useDeleteBook({ onSuccess: () => setDeleteTarget(null) })

  const isSaving = createMutation.isPending || updateMutation.isPending

  const filtered = books.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author.toLowerCase().includes(search.toLowerCase())
  )

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setFormOpen(true)
  }

  function openEdit(book) {
    setEditing(book)
    setForm({
      title: book.title,
      author: book.author,
      genre: book.genre || '',
      coverUrl: book.coverUrl || '',
      status: book.status,
      rating: book.rating ? String(book.rating) : '',
      notes: book.notes || '',
      finishedDate: book.finishedDate || '',
    })
    setFormError('')
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormError('')
  }

  function handleField(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!form.title.trim()) { setFormError('Title is required.'); return }
    if (!form.author.trim()) { setFormError('Author is required.'); return }
    const rating = form.rating ? parseInt(form.rating, 10) : 0
    if (form.rating && (rating < 1 || rating > 5)) { setFormError('Rating must be between 1 and 5.'); return }

    const payload = {
      title: form.title.trim(),
      author: form.author.trim(),
      genre: form.genre.trim(),
      coverUrl: form.coverUrl.trim(),
      status: form.status,
      rating,
      notes: form.notes.trim(),
      finishedDate: form.finishedDate,
    }

    if (editing) {
      updateMutation.mutate({ id: editing.id, ...payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const mutationError = (editing ? updateMutation.error : createMutation.error)?.message

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Books</h1>
          <p className="text-slate-500 mt-1">Track what you're reading</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { clearToken(); navigate('/login', { replace: true }) }}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Book
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveStatus(tab.value)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeStatus === tab.value
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by title or author..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm flex items-center justify-between gap-4">
          <span>{error.message}</span>
          <button onClick={() => refetch()} className="underline font-medium whitespace-nowrap hover:no-underline">Try again</button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-medium">No books found</p>
          <p className="text-sm mt-1">{search ? 'Try a different search' : 'Click "Add Book" to get started'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(book => (
            <BookCard key={book.id} book={book} onEdit={openEdit} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      {!isLoading && (
        <p className="text-sm text-slate-400 mt-6">
          Showing {filtered.length} of {books.length} book{books.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Add / Edit modal */}
      <Modal open={formOpen} onClose={closeForm} title={editing ? 'Edit Book' : 'Add Book'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Title" required>
            <input name="title" value={form.title} onChange={handleField} placeholder="Book title" className={inputCls} required />
          </Field>
          <Field label="Author" required>
            <input name="author" value={form.author} onChange={handleField} placeholder="Author name" className={inputCls} required />
          </Field>
          <Field label="Genre">
            <input name="genre" value={form.genre} onChange={handleField} placeholder="e.g. Fiction, Mystery" className={inputCls} />
          </Field>
          <Field label="Cover Image URL">
            <input name="coverUrl" value={form.coverUrl} onChange={handleField} placeholder="https://..." className={inputCls} />
          </Field>
          <Field label="Status" required>
            <select name="status" value={form.status} onChange={handleField} className={inputCls}>
              <option value="want_to_read">Want to Read</option>
              <option value="reading">Currently Reading</option>
              <option value="finished">Finished</option>
            </select>
          </Field>
          {form.status === 'finished' && (
            <>
              <Field label="Rating (1–5)">
                <select name="rating" value={form.rating} onChange={handleField} className={inputCls}>
                  <option value="">No rating</option>
                  {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{'★'.repeat(n)} ({n}/5)</option>)}
                </select>
              </Field>
              <Field label="Date Finished">
                <input type="date" name="finishedDate" value={form.finishedDate} onChange={handleField} className={inputCls} />
              </Field>
            </>
          )}
          <Field label="Notes">
            <textarea name="notes" value={form.notes} onChange={handleField} placeholder="Your thoughts..." rows={3} className={inputCls + ' resize-none'} />
          </Field>

          {(formError || mutationError) && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              {formError || mutationError}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={closeForm} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {isSaving ? 'Saving…' : editing ? 'Save Changes' : 'Add Book'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Book">
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-sm text-slate-700">
              Are you sure you want to delete{' '}
              <span className="font-semibold">{deleteTarget?.title}</span>? This cannot be undone.
            </p>
          </div>
          {deleteMutation.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              {deleteMutation.error.message}
            </p>
          )}
          <div className="flex gap-3">
            <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function BookCard({ book, onEdit, onDelete }) {
  const status = STATUS_BADGE[book.status] || { label: book.status, variant: 'outline' }

  return (
    <Card className="hover:shadow-md transition-shadow flex flex-col">
      {book.coverUrl ? (
        <img src={book.coverUrl} alt={book.title} className="w-full h-40 object-cover rounded-t-xl" />
      ) : (
        <div className="w-full h-40 bg-indigo-50 rounded-t-xl flex items-center justify-center">
          <BookOpen className="w-10 h-10 text-indigo-200" />
        </div>
      )}
      <CardContent className="flex-1 flex flex-col pt-4 pb-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-slate-900 leading-snug line-clamp-2">{book.title}</h3>
          <Badge variant={status.variant} className="shrink-0">{status.label}</Badge>
        </div>
        <p className="text-sm text-slate-500 mb-3">{book.author}</p>
        {book.genre && <p className="text-xs text-slate-400 mb-3">{book.genre}</p>}
        {book.rating > 0 && (
          <p className="text-sm text-amber-500 mb-2">{'★'.repeat(book.rating)}{'☆'.repeat(5 - book.rating)}</p>
        )}
        {book.notes && <p className="text-xs text-slate-500 line-clamp-2 mb-3">{book.notes}</p>}
        <div className="flex gap-2 mt-auto">
          <button
            onClick={() => onEdit(book)}
            className="flex-1 text-xs py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(book)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
