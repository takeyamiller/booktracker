import { cn } from '@/lib/utils'

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse bg-slate-200 rounded-lg', className)} />
}
