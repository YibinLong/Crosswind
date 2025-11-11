import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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
    return `Wind ${formatWeatherNumber(weatherReport.windKts)}kt${weatherReport.windGustKts ? ` gusting ${formatWeatherNumber(weatherReport.windGustKts)}kt` : ''} exceeds limits`
  }
  if (issues.includes('visibility')) {
    return `Visibility ${formatWeatherNumber(weatherReport.visibility)}mi below minimum`
  }
  if (issues.includes('ceiling')) {
    return `Ceiling ${formatWeatherNumber(weatherReport.ceilingFt)}ft below minimum`
  }

  return `Weather conditions: ${weatherReport.condition}`
}
