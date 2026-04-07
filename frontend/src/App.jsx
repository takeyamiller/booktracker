import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import ProtectedRoute from '@/components/ProtectedRoute'
import Books from '@/pages/Books'
import BookDetail from '@/pages/BookDetail'
import Login from '@/pages/Login'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-slate-50 lg:flex">
                <Sidebar />
                <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
                  <Routes>
                    <Route path="/" element={<Books />} />
                  <Route path="/books/:id" element={<BookDetail />} />
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
