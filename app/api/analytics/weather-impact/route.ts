import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { withAuth, requireRole } from '@/lib/middleware/auth'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  // Apply authentication and role-based access control
  const authResponse = await withAuth(request)
  if (authResponse) return authResponse

  // Only allow admin and instructor roles to access analytics
  const roleResponse = await requireRole(request, ['admin', 'instructor'])
  if (roleResponse) return roleResponse
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Default to last 90 days if no date range provided
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000)

    // Get all bookings with weather reports in the date range
    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        weatherReports: true,
      },
    })

    // Analyze weather factors causing conflicts
    const weatherFactorCounts = new Map<string, number>()
    let totalConflicts = 0

    bookings.forEach(booking => {
      booking.weatherReports.forEach(report => {
        if (!report.isSafe && report.violatedMinimums.length > 0) {
          totalConflicts += 1
          report.violatedMinimums.forEach(minimum => {
            // Categorize violated minimums into broader factors
            let factor = 'Other'
            if (minimum.toLowerCase().includes('wind') || minimum.toLowerCase().includes('crosswind')) {
              factor = 'Crosswinds'
            } else if (minimum.toLowerCase().includes('visibility') || minimum.toLowerCase().includes('viz')) {
              factor = 'Low Visibility'
            } else if (minimum.toLowerCase().includes('thunderstorm') || minimum.toLowerCase().includes('storm')) {
              factor = 'Thunderstorms'
            } else if (minimum.toLowerCase().includes('temperature') || minimum.toLowerCase().includes('temp')) {
              factor = 'Temperature'
            } else if (minimum.toLowerCase().includes('icing') || minimum.toLowerCase().includes('ice')) {
              factor = 'Icing Conditions'
            } else if (minimum.toLowerCase().includes('ceiling') || minimum.toLowerCase().includes('cloud')) {
              factor = 'Low Ceiling'
            }

            weatherFactorCounts.set(factor, (weatherFactorCounts.get(factor) || 0) + 1)
          })
        }
      })
    })

    // Convert to array and calculate percentages
    const weatherFactors = Array.from(weatherFactorCounts.entries())
      .map(([factor, incidents]) => ({
        factor,
        incidents,
        percentage: Math.round((incidents / totalConflicts) * 100),
      }))
      .sort((a, b) => b.incidents - a.incidents)
      .slice(0, 5) // Top 5 factors

    // Analyze airport impact (using departure coordinates as proxy for airports)
    const airportConflictMap = new Map<string, { conflicts: number; total: number; name: string }>()

    // Simple coordinate to airport code mapping (this is a simplified approach)
    // In a real implementation, you'd use a reverse geocoding service
    const coordinateToAirport = (lat: number, lon: number) => {
      // This is a very simplified mapping - in production you'd use a proper geocoding service
      if (Math.abs(lat - 40.64) < 0.5 && Math.abs(lon - -73.78) < 0.5) return { code: 'KJFK', name: 'JFK International' }
      if (Math.abs(lat - 33.94) < 0.5 && Math.abs(lon - -118.41) < 0.5) return { code: 'KLAX', name: 'Los Angeles Intl' }
      if (Math.abs(lat - 41.97) < 0.5 && Math.abs(lon - -87.90) < 0.5) return { code: 'KORD', name: "O'Hare International" }
      if (Math.abs(lat - 37.62) < 0.5 && Math.abs(lon - -122.38) < 0.5) return { code: 'KSFO', name: 'San Francisco Intl' }
      if (Math.abs(lat - 42.36) < 0.5 && Math.abs(lon - -71.01) < 0.5) return { code: 'KBOS', name: 'Boston Logan' }
      if (Math.abs(lat - 25.79) < 0.5 && Math.abs(lon - -80.28) < 0.5) return { code: 'KMIA', name: 'Miami International' }
      if (Math.abs(lat - 47.45) < 0.5 && Math.abs(lon - -122.31) < 0.5) return { code: 'KSEA', name: 'Seattle-Tacoma Intl' }
      if (Math.abs(lat - 39.87) < 0.5 && Math.abs(lon - -104.67) < 0.5) return { code: 'KDEN', name: 'Denver International' }

      // Default to a generic location if no match
      return { code: 'KGEN', name: 'General Location' }
    }

    bookings.forEach(booking => {
      const airport = coordinateToAirport(booking.departureLat, booking.departureLon)

      if (!airportConflictMap.has(airport.code)) {
        airportConflictMap.set(airport.code, { conflicts: 0, total: 0, name: airport.name })
      }

      const current = airportConflictMap.get(airport.code)!
      current.total += 1

      const hasConflict = booking.weatherReports.some(report => !report.isSafe)
      if (hasConflict) {
        current.conflicts += 1
      }
    })

    // Convert to array and sort by conflicts
    const airportImpact = Array.from(airportConflictMap.values())
      .filter(airport => airport.total >= 3) // Only include airports with 3+ flights
      .sort((a, b) => b.conflicts - a.conflicts)
      .slice(0, 4) // Top 4 airports

    const weatherImpactData = {
      weatherFactors,
      airportImpact,
    }

    return NextResponse.json({
      success: true,
      data: weatherImpactData,
    })
  } catch (error) {
    console.error('Analytics weather impact error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch weather impact analytics' },
      { status: 500 }
    )
  }
}