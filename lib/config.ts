// Application-wide configuration constants

export const REFRESH_INTERVALS = {
  WEATHER_ALERTS: 30000,      // 30 seconds - critical for safety
  FLIGHTS_DATA: 120000,       // 2 minutes - for flight management
  DASHBOARD_STATS: 300000,    // 5 minutes - for overview stats
  ANALYTICS_DATA: 600000,     // 10 minutes - for analytics
  BOOKING_STATUS: 60000,      // 1 minute - for active bookings
} as const

export const API_CONFIG = {
  TIMEOUT: 30000,             // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,          // 1 second between retries
} as const

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const

export const WEATHER_THRESHOLDS = {
  HIGH_WIND: 25,              // knots
  LOW_VISIBILITY: 3,          // statue miles
  LOW_CEILING: 1000,          // feet
  HIGH_GUSTS: 35,             // knots
} as const

export const NOTIFICATION_TYPES = {
  WEATHER_CONFLICT: 'weather_conflict',
  BOOKING_CONFIRMED: 'booking_confirmed',
  BOOKING_CANCELLED: 'booking_cancelled',
  INSTRUCTOR_ASSIGNED: 'instructor_assigned',
  REMINDER: 'reminder',
} as const

export const FLIGHT_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  CONFLICT: 'conflict',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const

export const TRAINING_LEVELS = {
  STUDENT: 'student',
  PRIVATE: 'private',
  INSTRUMENT: 'instrument',
  COMMERCIAL: 'commercial',
} as const