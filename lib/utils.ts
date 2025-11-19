import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface KnownLocation {
  name: string
  lat: number
  lon: number
}

const KNOWN_LOCATIONS: KnownLocation[] = [
  { name: 'San Francisco', lat: 37.7749, lon: -122.4194 },
  { name: 'San Jose', lat: 37.3382, lon: -121.8863 },
  { name: 'Oakland', lat: 37.8044, lon: -122.2712 },
  { name: 'Sacramento', lat: 38.5816, lon: -121.4944 },
  { name: 'Fresno', lat: 36.7783, lon: -119.4179 },
  { name: 'Seattle', lat: 47.6062, lon: -122.3321 },
  { name: 'Portland', lat: 45.5152, lon: -122.6784 },
  { name: 'Los Angeles', lat: 34.0522, lon: -118.2437 },
  { name: 'Phoenix', lat: 33.4484, lon: -112.074 },
  { name: 'Denver', lat: 39.7392, lon: -104.9903 },
  { name: 'Chicago', lat: 41.8781, lon: -87.6298 },
  { name: 'New York', lat: 40.7128, lon: -74.006 },
  { name: 'Miami', lat: 25.7617, lon: -80.1918 }
]

const CITY_MATCH_THRESHOLD_KM = 80

// Flight route utilities
export const formatRoute = (
  departureLat: number,
  departureLon: number,
  arrivalLat: number,
  arrivalLon: number
): string => {
  const formatCoordinate = (lat: number, lon: number): string => {
    const latDir = lat >= 0 ? 'N' : 'S'
    const lonDir = lon >= 0 ? 'E' : 'W'
    return `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lon).toFixed(2)}°${lonDir}`
  }

  return `${formatCoordinate(departureLat, departureLon)} → ${formatCoordinate(arrivalLat, arrivalLon)}`
}

// Simplified route format for display
export const formatShortRoute = (
  departureLat: number,
  departureLon: number,
  arrivalLat: number,
  arrivalLon: number
): string => {
  return `${departureLat.toFixed(2)},${departureLon.toFixed(2)} → ${arrivalLat.toFixed(2)},${arrivalLon.toFixed(2)}`
}

export const getCityFromCoordinates = (
  latitude?: number | null,
  longitude?: number | null
): string | null => {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return null
  }

  let closest: { location: KnownLocation; distance: number } | null = null

  for (const location of KNOWN_LOCATIONS) {
    const distance = calculateDistance(latitude, longitude, location.lat, location.lon)
    if (!closest || distance < closest.distance) {
      closest = { location, distance }
    }
  }

  if (closest && closest.distance <= CITY_MATCH_THRESHOLD_KM) {
    return closest.location.name
  }

  return null
}

export const formatRouteLocations = (
  departureLat?: number | null,
  departureLon?: number | null,
  arrivalLat?: number | null,
  arrivalLon?: number | null
): string => {
  const departureCity = getCityFromCoordinates(departureLat, departureLon)
  const arrivalCity = getCityFromCoordinates(arrivalLat, arrivalLon)

  if (departureCity && arrivalCity) {
    return `${departureCity} → ${arrivalCity}`
  }

  if (departureCity && typeof arrivalLat === 'number' && typeof arrivalLon === 'number') {
    return `${departureCity} → ${arrivalLat.toFixed(2)},${arrivalLon.toFixed(2)}`
  }

  if (arrivalCity && typeof departureLat === 'number' && typeof departureLon === 'number') {
    return `${departureLat.toFixed(2)},${departureLon.toFixed(2)} → ${arrivalCity}`
  }

  if (
    typeof departureLat === 'number' &&
    typeof departureLon === 'number' &&
    typeof arrivalLat === 'number' &&
    typeof arrivalLon === 'number'
  ) {
    return formatShortRoute(departureLat, departureLon, arrivalLat, arrivalLon)
  }

  if (typeof departureLat === 'number' && typeof departureLon === 'number') {
    return `${departureLat.toFixed(2)},${departureLon.toFixed(2)}`
  }

  return 'Route unavailable'
}

// Calculate approximate distance between coordinates (simplified)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Weather formatting utilities
export const formatWeatherNumber = (value: number, decimals: number = 2): string => {
  return value.toFixed(decimals)
}

export const formatWindSpeed = (windKts: number, windGustKts?: number): string => {
  const formattedWind = `${formatWeatherNumber(windKts)}kt`
  if (windGustKts) {
    return `${formattedWind} wind gusting to ${formatWeatherNumber(windGustKts)}kt`
  }
  return `${formattedWind} wind`
}

export const formatVisibility = (visibility: number): string => {
  return `${formatWeatherNumber(visibility)} mi`
}

export const formatCeiling = (ceilingFt: number): string => {
  return `${formatWeatherNumber(ceilingFt)}ft`
}

export const formatAircraftLabel = (
  aircraft?: {
    model?: string | null
    tailNumber?: string | null
  } | null
): string => {
  if (!aircraft) {
    return 'Unassigned Aircraft'
  }

  const model = aircraft.model?.trim()
  const tailNumber = aircraft.tailNumber?.trim()

  if (model && tailNumber) {
    return `${model} (${tailNumber})`
  }

  return model || tailNumber || 'Unassigned Aircraft'
}

// Format violated minimums with proper capitalization
export const formatViolatedMinimums = (violatedMinimums: string[]): string => {
  return violatedMinimums
    .map(minimum => minimum.charAt(0).toUpperCase() + minimum.slice(1).replace(/_/g, ' '))
    .join(', ')
}

// Capitalize words (for weather conditions, etc.)
export const capitalizeWords = (str: string): string => {
  return str.replace(/\b\w/g, char => char.toUpperCase())
}

// Format weather conflict messages with truncated numbers
export const formatWeatherConflictMessage = (booking: any): string | null => {
  if (!booking.weatherReports || !booking.weatherReports[0] || booking.weatherReports[0].isSafe) {
    return null
  }

  const weatherReport = booking.weatherReports[0]
  const issues = weatherReport.violatedMinimums || []

  if (issues.includes('wind')) {
    return `Wind ${formatWeatherNumber(weatherReport.windKts ?? 0)}kt${weatherReport.windGustKts ? ` gusting ${formatWeatherNumber(weatherReport.windGustKts)}kt` : ''} exceeds limits`
  }
  if (issues.includes('visibility')) {
    return `Visibility ${formatVisibility(weatherReport.visibility ?? 0)} below minimum`
  }
  if (issues.includes('ceiling')) {
    return `Ceiling ${formatCeiling(weatherReport.ceilingFt ?? 0)} below minimum`
  }

  return `Weather conditions: ${weatherReport.condition}`
}
