import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, AlertTriangle, BookOpen } from 'lucide-react'
import { useBook, useUpdateBook, useDeleteBook } from '@/lib/queries'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Modal } from '@/components/ui/modal'

const STATUS_BADGE = {
  want_to_read: { label: 'Want to Read', variant: 'outline' },
  reading: { label: 'Reading', variant: 'warning' },
  finished: { label: 'Finished', variant: 'success' },
}

const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 bg-white'

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

export default function BookDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: book, isLoading, error } = useBook(id)

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [form, setForm] = useState(null)
  const [formError, setFormError] = useState('')

  const updateMutation = useUpdateBook({ onSuccess: () => setEditOpen(false) })
  const deleteMutation = useDeleteBook({ onSuccess: () => navigate('/', { replace: true }) })

  function openEdit() {
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
    setEditOpen(true)
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

    updateMutation.mutate({
      id: parseInt(id, 10),
      title: form.title.trim(),
      author: form.author.trim(),
      genre: form.genre.trim(),
      coverUrl: form.coverUrl.trim(),
      status: form.status,
      rating,
      notes: form.notes.trim(),
      finishedDate: form.finishedDate,
    })
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center">
        <p className="text-slate-500">Book not found.</p>
        <Link to="/" className="text-indigo-600 text-sm mt-2 inline-block hover:underline">
          Back to books
        </Link>
      </div>
    )
  }

  const status = STATUS_BADGE[book.status] || { label: book.status, variant: 'outline' }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {/* Back */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        All books
      </Link>

      {/* Book card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Cover banner */}
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 bg-indigo-50 flex items-center justify-center">
            <BookOpen className="w-14 h-14 text-indigo-200" />
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">{book.title}</h1>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={openEdit} aria-label="Edit book"
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => setDeleteOpen(true)} aria-label="Delete book"
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-slate-500 mb-4">{book.author}</p>

          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant={status.variant}>{status.label}</Badge>
            {book.genre && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                {book.genre}
              </span>
            )}
          </div>

          {book.rating > 0 && (
            <p className="text-lg text-amber-500 mb-2">
              {'★'.repeat(book.rating)}{'☆'.repeat(5 - book.rating)}
              <span className="text-sm text-slate-400 ml-2">{book.rating}/5</span>
            </p>
          )}

          {book.finishedDate && (
            <p className="text-sm text-slate-400 mb-4">Finished {book.finishedDate}</p>
          )}

          {book.notes && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h2 className="text-sm font-semibold text-slate-700 mb-2">Notes</h2>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{book.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {form && (
        <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Book">
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

            {(formError || updateMutation.error) && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                {formError || updateMutation.error?.message}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setEditOpen(false)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={updateMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
                {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirmation */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Book">
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-sm text-slate-700">
              Are you sure you want to delete{' '}
              <span className="font-semibold">{book.title}</span>? This cannot be undone.
            </p>
          </div>
          {deleteMutation.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              {deleteMutation.error.message}
            </p>
          )}
          <div className="flex gap-3">
            <button onClick={() => setDeleteOpen(false)}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button onClick={() => deleteMutation.mutate(parseInt(id, 10))} disabled={deleteMutation.isPending}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50">
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
