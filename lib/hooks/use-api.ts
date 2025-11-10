import { useState, useEffect, useCallback, useRef } from 'react'
import { api, ApiResponse } from '@/lib/api'
import { AsyncState } from '@/lib/types'

// Generic hook for API calls with loading and error handling
export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  deps: any[] = []
): AsyncState<T> & { refetch: () => void; data: T | null } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  })

  const fetchData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      const response = await apiCall()
      setState({
        data: response.data,
        loading: false,
        error: null,
      })
    } catch (error: any) {
      setState({
        data: null,
        loading: false,
        error: error.response?.data?.error || error.message || 'Unknown error',
      })
    }
  }, deps)

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    ...state,
    refetch: fetchData,
  }
}

// Hook for paginated data
export function usePaginatedApi<T>(
  apiCall: (page: number, limit: number) => Promise<ApiResponse<{ data: T[]; pagination: any }>>,
  initialLimit: number = 20
) {
  const [state, setState] = useState<{
    data: T[]
    loading: boolean
    error: string | null
    page: number
    totalPages: number
    totalCount: number
  }>({
    data: [],
    loading: true,
    error: null,
    page: 1,
    totalPages: 1,
    totalCount: 0,
  })

  const fetchData = useCallback(async (page: number = state.page) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      const response = await apiCall(page, initialLimit)
      setState({
        data: response.data.data,
        loading: false,
        error: null,
        page,
        totalPages: response.data.pagination.pages,
        totalCount: response.data.pagination.total,
      })
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.error || error.message || 'Unknown error',
      }))
    }
  }, [apiCall, initialLimit, state.page])

  useEffect(() => {
    fetchData(1)
  }, [fetchData])

  const nextPage = () => {
    if (state.page < state.totalPages) {
      fetchData(state.page + 1)
    }
  }

  const prevPage = () => {
    if (state.page > 1) {
      fetchData(state.page - 1)
    }
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= state.totalPages) {
      fetchData(page)
    }
  }

  return {
    ...state,
    refetch: () => fetchData(state.page),
    nextPage,
    prevPage,
    goToPage,
  }
}

// Hook for real-time data with polling
export function useRealTimeApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  interval: number,
  deps: any[] = []
): AsyncState<T> & { refetch: () => void; data: T | null } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const response = await apiCall()
      setState(prev => ({
        ...prev,
        data: response.data,
        loading: false,
        error: null,
      }))
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.error || error.message || 'Unknown error',
      }))
    }
  }, deps)

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Initial fetch
    fetchData()

    // Set up polling
    if (interval > 0) {
      intervalRef.current = setInterval(fetchData, interval)
    }
  }, [fetchData, interval])

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    startPolling()
    return stopPolling
  }, [startPolling, stopPolling])

  return {
    ...state,
    refetch: fetchData,
    data: state.data,
  }
}

// Hook for mutations (POST, PUT, DELETE)
export function useMutation<T, P = any>(
  mutationCall: (params: P) => Promise<ApiResponse<T>>
) {
  const [state, setState] = useState<{
    data: T | null
    loading: boolean
    error: string | null
  }>({
    data: null,
    loading: false,
    error: null,
  })

  const mutate = useCallback(async (params: P) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      const response = await mutationCall(params)
      setState({
        data: response.data,
        loading: false,
        error: null,
      })
      return response.data
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error'
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      })
      throw error
    }
  }, [mutationCall])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    })
  }, [])

  return {
    ...state,
    mutate,
    reset,
  }
}