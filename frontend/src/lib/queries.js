import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './api'

export function useBooks(status) {
  return useQuery({
    queryKey: ['books', status ?? 'all'],
    queryFn: () => api.books(status),
  })
}

export function useBook(id) {
  return useQuery({
    queryKey: ['books', id],
    queryFn: () => api.book(id),
    enabled: !!id,
  })
}

export function useCreateBook(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.createBook,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['books'] }),
    ...options,
  })
}

export function useUpdateBook(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }) => api.updateBook(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['books'] }),
    ...options,
  })
}

export function useDeleteBook(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.deleteBook,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['books'] }),
    ...options,
  })
}
