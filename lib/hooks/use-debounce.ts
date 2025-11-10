import { useState, useEffect } from 'react'

// Debounce hook for search inputs and other frequent changes
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Hook for debounced callback
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const [debouncedCall, setDebouncedCall] = useState<T>(() => callback)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCall(() => callback)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [callback, delay])

  return debouncedCall
}