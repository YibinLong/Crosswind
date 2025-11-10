import axios from 'axios'

// Create axios instance with default configuration
export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Enhanced debugging for 405 errors
    if (error.response?.status === 405) {
      console.error('🚨 [API 405 ERROR] Method not allowed')
      console.error('📄 URL:', error.config?.url)
      console.error('🔧 Method:', error.config?.method?.toUpperCase())
      console.error('🔍 Request config:', {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data
      })
      console.error('📋 Response:', error.response.data)
    }

    // Handle auth errors
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }

    // Handle network errors
    if (!error.response) {
      error.message = 'Network error. Please check your connection.'
    }

    return Promise.reject(error)
  }
)

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  error?: string
}

// Pagination response type
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Unified response type that handles both direct arrays and paginated responses
export interface BookingsResponse {
  bookings?: Booking[]
  data?: Booking[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Booking types
export interface Booking {
  id: number
  studentId: number
  instructorId: number
  aircraftId: number
  scheduledDate: string
  departureLat: number
  departureLon: number
  arrivalLat: number
  arrivalLon: number
  status: 'scheduled' | 'confirmed' | 'conflict' | 'cancelled' | 'completed'
  createdAt: string
  updatedAt: string
  student?: {
    id: number
    name: string
    email: string
    trainingLevel: string
  }
  instructor?: {
    id: number
    name: string
    email: string
  }
  aircraft?: {
    id: number
    tailNumber: string
    model: string
    status: string
  }
  weatherReports?: Array<{
    id: number
    windKts: number
    windGustKts: number
    visibility: number
    ceilingFt: number
    condition: string
    temperature: number
    isSafe: boolean
    violatedMinimums: string[]
    createdAt: string
  }>
  rescheduleSuggestions?: Array<{
    id: number
    proposedDate: string
    proposedTime: string
    weatherSummary: string
    confidence: number
    reason: string
    selected: boolean
    createdAt: string
  }>
}

export interface Student {
  id: number
  name: string
  email: string
  trainingLevel: string
  userId?: number
  createdAt: string
  updatedAt: string
  user?: {
    id: number
    email: string
    role: string
  }
  _count?: {
    bookings: number
  }
}

export interface Instructor {
  id: number
  name: string
  email: string
  createdAt: string
  updatedAt: string
  _count?: {
    bookings: number
  }
}

export interface Aircraft {
  id: number
  tailNumber: string
  model: string
  status: 'available' | 'in-use' | 'maintenance' | 'unavailable'
  createdAt: string
  updatedAt: string
  _count?: {
    bookings: number
  }
}

export interface WeatherAlert {
  id: number
  bookingId: number
  student: {
    name: string
    trainingLevel: string
  }
  weatherReport: {
    windKts: number
    windGustKts: number
    visibility: number
    ceilingFt: number
    condition: string
    temperature: number
    isSafe: boolean
    violatedMinimums: string[]
  }
  createdAt: string
}

export interface DashboardStats {
  todayFlights: number
  weeklyScheduled: number
  activeConflicts: number
  completionRate: number
  totalStudents: number
  totalInstructors: number
  totalAircraft: number
}

export interface AuditLog {
  id: number
  bookingId: number | null
  action: string
  performedBy: string
  details: string
  createdAt: string
  booking?: {
    id: number
    student: {
      name: string
    }
  }
}

// API service functions
export const api = {
  // Auth endpoints
  auth: {
    login: (email: string, password: string) =>
      axiosInstance.post('/api/auth/login', { email, password }),
    signup: (email: string, password: string, name: string, trainingLevel?: string) =>
      axiosInstance.post('/api/auth/signup', { email, password, name, trainingLevel }),
  },

  // Bookings endpoints
  bookings: {
    getAll: (params?: {
      status?: string
      studentId?: number
      instructorId?: number
      startDate?: string
      endDate?: string
      upcoming?: boolean
      page?: number
      limit?: number
    }) => axiosInstance.get<BookingsResponse>('/api/bookings', { params }),

    getById: (id: number) =>
      axiosInstance.get<Booking>(`/api/bookings/${id}`),

    create: (data: {
      studentId: number
      instructorId: number
      aircraftId: number
      scheduledDate: string
      departureLat: number
      departureLon: number
      arrivalLat: number
      arrivalLon: number
    }) => axiosInstance.post<Booking>('/api/bookings', data),

    update: (id: number, data: Partial<Booking>) =>
      axiosInstance.patch<Booking>(`/api/bookings/${id}`, data),

    delete: (id: number) =>
      axiosInstance.delete(`/api/bookings/${id}`),

    // Rescheduling
    getRescheduleSuggestions: (id: number) =>
      axiosInstance.get(`/api/bookings/${id}/reschedule`),

    generateRescheduleSuggestions: (id: number, data?: any) =>
      axiosInstance.post(`/api/bookings/${id}/reschedule`, data ?? {}),

    confirmReschedule: (id: number, suggestionId: number) =>
      axiosInstance.post(`/api/bookings/${id}/reschedule/confirm`, { suggestionId }),
  },

  // Students endpoints
  students: {
    getAll: (params?: {
      search?: string
      trainingLevel?: string
      page?: number
      limit?: number
    }) => axiosInstance.get<Student[]>('/api/students', { params }),

    getById: (id: number) =>
      axiosInstance.get<Student>(`/api/students/${id}`),

    create: (data: {
      name: string
      email: string
      trainingLevel: string
    }) => axiosInstance.post<Student>('/api/students', data),

    update: (id: number, data: Partial<Student>) =>
      axiosInstance.patch<Student>(`/api/students/${id}`, data),

    delete: (id: number) =>
      axiosInstance.delete(`/api/students/${id}`),
  },

  // Instructors endpoints
  instructors: {
    getAll: (params?: {
      search?: string
      available?: boolean
      page?: number
      limit?: number
    }) => axiosInstance.get<Instructor[]>('/api/instructors', { params }),

    getById: (id: number) =>
      axiosInstance.get<Instructor>(`/api/instructors/${id}`),

    create: (data: {
      name: string
      email: string
    }) => axiosInstance.post<Instructor>('/api/instructors', data),

    update: (id: number, data: Partial<Instructor>) =>
      axiosInstance.patch<Instructor>(`/api/instructors/${id}`, data),

    delete: (id: number) =>
      axiosInstance.delete(`/api/instructors/${id}`),
  },

  // Aircraft endpoints
  aircraft: {
    getAll: (params?: {
      search?: string
      status?: string
      available?: boolean
      page?: number
      limit?: number
    }) => axiosInstance.get<Aircraft[]>('/api/aircraft', { params }),

    getById: (id: number) =>
      axiosInstance.get<Aircraft>(`/api/aircraft/${id}`),

    create: (data: {
      tailNumber: string
      model: string
      status?: string
    }) => axiosInstance.post<Aircraft>('/api/aircraft', data),

    update: (id: number, data: Partial<Aircraft>) =>
      axiosInstance.patch<Aircraft>(`/api/aircraft/${id}`, data),

    delete: (id: number) =>
      axiosInstance.delete(`/api/aircraft/${id}`),
  },

  // Dashboard endpoints
  dashboard: {
    getStats: () =>
      axiosInstance.get<DashboardStats>('/api/dashboard/stats'),
  },

  // Activity endpoints
  activity: {
    getRecent: (params?: {
      page?: number
      limit?: number
      action?: string
    }) => axiosInstance.get<AuditLog[]>('/api/activity', { params }),
  },

  // Alerts endpoints
  alerts: {
    getAll: (params?: {
      status?: string
      limit?: number
      offset?: number
      studentId?: number
      instructorId?: number
    }) => axiosInstance.get('/api/alerts', { params }),

    refresh: () =>
      axiosInstance.post('/api/alerts/refresh'),
  },

  // Analytics endpoints
  analytics: {
    getOverview: (params?: {
      startDate?: string
      endDate?: string
    }) => axiosInstance.get('/api/analytics/overview', { params }),

    getPerformance: (params?: {
      startDate?: string
      endDate?: string
    }) => axiosInstance.get('/api/analytics/performance', { params }),

    getWeatherImpact: (params?: {
      startDate?: string
      endDate?: string
    }) => axiosInstance.get('/api/analytics/weather-impact', { params }),
  },
}

export default api