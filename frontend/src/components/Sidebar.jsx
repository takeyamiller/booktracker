import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { BookOpen, Home, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { to: '/', label: 'My Books', icon: Home },
]

export default function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-indigo-600 text-white rounded-lg shadow-md"
      >
        <Menu className="w-5 h-5" aria-hidden="true" />
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 z-50 flex flex-col transition-transform duration-200 shadow-2xl',
          'lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #3730a3 60%, #4f46e5 100%)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-white/10">
          <NavLink to="/" className="flex items-center gap-3 font-black text-lg text-white tracking-tight" onClick={() => setOpen(false)}>
            <div className="bg-amber-400 rounded-lg p-1.5">
              <BookOpen className="w-5 h-5 text-slate-900" />
            </div>
            <span>Book Tracker</span>
          </NavLink>
          <button onClick={() => setOpen(false)} className="lg:hidden text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all',
                  isActive
                    ? 'bg-white text-indigo-700 shadow-md'
                    : 'text-white/75 hover:text-white hover:bg-white/15'
                )
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-6 py-5 border-t border-white/10">
          <p className="text-white/40 text-xs font-medium uppercase tracking-widest">Reading List</p>
        </div>
      </aside>
    </>
  )
}
