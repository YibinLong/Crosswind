// Comprehensive type definitions for the Crosswind application

// Base entity types
export interface BaseEntity {
  id: number
  createdAt: string
  updatedAt: string
}

// User and authentication types
export interface User extends BaseEntity {
  email: string
  name: string
  role: UserRole
  avatar?: string
}

export type UserRole = 'student' | 'instructor' | 'admin' | 'flight_school'

export interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
}

// Student types (maintaining backward compatibility)
export interface Student extends BaseEntity {
  name: string
  email: string
  trainingLevel: TrainingLevel
  userId?: number
  user?: User
  _count?: {
    bookings: number
  }
}

export type TrainingLevel = 'student-pilot' | 'private-pilot' | 'instrument-rated' | 'commercial-pilot' | 'instructor' | 'student' | 'private' | 'instrument' | 'commercial' | 'airline_transport'

export interface FlightBooking {
  id: string
  studentId: string
  scheduledDate: string
  scheduledTime: string
  departureLocation: string
  arrivalLocation: string
  instructorId: string
  aircraftId: string
  status: "pending" | "confirmed" | "conflict" | "cancelled" | "completed"
  weatherIssue?: string
}

export interface WeatherData {
  location: string
  timestamp: string
  visibility: number
  windSpeed: number
  windGust?: number
  temperature: number
  conditions: string
  isSafe: boolean
  violatedMinimums?: string[]
}

export interface RescheduleOption {
  id: string
  date: string
  time: string
  weather: WeatherData
  confidence: number
  reason: string
}

export interface WeatherAlert {
  id: string
  flightId: string
  severity: "high" | "medium" | "low"
  detectedAt: string
  weatherData: WeatherData
  studentName: string
  trainingLevel: string
}

// Weather minimums by training level
export const WEATHER_MINIMUMS = {
  "student-pilot": {
    visibility: 5, // statute miles
    ceiling: 3000, // feet
    windSpeed: 10, // knots
    crosswind: 10, // knots
  },
  "private-pilot": {
    visibility: 3,
    ceiling: 1000,
    windSpeed: 15,
    crosswind: 12,
  },
  "instrument-rated": {
    visibility: 0, // can fly IFR
    ceiling: 0,
    windSpeed: 20,
    crosswind: 15,
  },
} as const

// Additional comprehensive types
export interface Instructor extends BaseEntity {
  name: string
  email: string
  userId?: number
  user?: User
  _count?: {
    bookings: number
  }
}

export interface Aircraft extends BaseEntity {
  tailNumber: string
  model: string
  status: AircraftStatus
  _count?: {
    bookings: number
  }
}

export type AircraftStatus = 'available' | 'in-use' | 'maintenance' | 'unavailable'

// Enhanced booking types
export interface Booking extends BaseEntity {
  studentId: number
  instructorId: number
  aircraftId: number
  scheduledDate: string
  departureLat: number
  departureLon: number
  arrivalLat: number
  arrivalLon: number
  status: FlightStatus
  student?: Student
  instructor?: Instructor
  aircraft?: Aircraft
  weatherReports?: WeatherReport[]
  rescheduleSuggestions?: RescheduleSuggestion[]
}

export type FlightStatus = 'scheduled' | 'confirmed' | 'conflict' | 'cancelled' | 'completed'

// Weather report types
export interface WeatherReport extends BaseEntity {
  bookingId: number
  location: 'departure' | 'arrival'
  windKts: number
  windGustKts?: number
  visibility: number
  ceilingFt: number
  condition: string
  temperature: number
  isSafe: boolean
  violatedMinimums: WeatherMinimum[]
}

export type WeatherMinimum = 'wind_speed' | 'wind_gusts' | 'visibility' | 'ceiling' | 'clouds' | 'precipitation'

// Rescheduling types
export interface RescheduleSuggestion extends BaseEntity {
  bookingId: number
  proposedDate: string
  proposedTime: string
  weatherSummary: string
  confidence: number
  reason: string
  selected: boolean
}

export interface RescheduleRequest {
  reason: string
  newDate?: string
  newTime?: string
  suggestionId?: number
}

// Enhanced alert types
export interface WeatherAlert extends BaseEntity {
  bookingId: number
  student: {
    name: string
    trainingLevel: string
  }
  weatherReport: {
    windKts: number
    windGustKts?: number
    visibility: number
    ceilingFt: number
    condition: string
    temperature: number
    isSafe: boolean
    violatedMinimums: WeatherMinimum[]
  }
  type: AlertType
  severity: AlertSeverity
  actions?: AlertAction[]
}

export type AlertType = 'weather_conflict' | 'reminder' | 'booking_confirmed' | 'booking_cancelled'
export type AlertSeverity = 'high' | 'medium' | 'low'

export interface AlertAction {
  label: string
  action: string
  url: string
}

// Dashboard and analytics types
export interface DashboardStats {
  todayFlights: number
  weeklyScheduled: number
  activeConflicts: number
  completionRate: number
  totalStudents: number
  totalInstructors: number
  totalAircraft: number
}

export interface AnalyticsOverview {
  totalFlights: number
  weatherConflicts: number
  successfulReschedules: number
  avgRescheduleTime: number
  trends: {
    totalFlightsChange: string
    conflictsChange: string
    rescheduleTimeChange: string
  }
  successRate: string
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

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

// Form types
export interface CreateBookingForm {
  studentId: string
  instructorId: string
  aircraftId: string
  date: string
  time: string
  departureLat: number
  departureLon: number
  arrivalLat: number
  arrivalLon: number
}

export interface LoginForm {
  email: string
  password: string
}

export interface SignupForm {
  name: string
  email: string
  password: string
  confirmPassword: string
  role?: UserRole
  trainingLevel?: TrainingLevel
}

// Error types
export interface ApiError {
  message: string
  code?: number
  details?: any
  source: string
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

// UI state types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}
