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
