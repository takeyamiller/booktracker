import { cn } from '@/lib/utils'

export function Card({ className, children }) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm', className)}>
      {children}
    </div>
  )
}

export function CardHeader({ className, children }) {
  return <div className={cn('px-6 py-5 border-b border-slate-100', className)}>{children}</div>
}

export function CardTitle({ className, children }) {
  return <h2 className={cn('text-lg font-semibold text-slate-900', className)}>{children}</h2>
}

export function CardContent({ className, children }) {
  return <div className={cn('px-6 py-5', className)}>{children}</div>
}
