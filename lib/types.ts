// Type definitions for backend integration
export interface Student {
  id: string
  name: string
  email: string
  phone: string
  trainingLevel: "student-pilot" | "private-pilot" | "instrument-rated" | "commercial-pilot" | "instructor"
}

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
