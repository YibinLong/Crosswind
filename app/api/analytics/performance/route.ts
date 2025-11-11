import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { authenticate, hasRole } from '@/lib/middleware/auth'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Apply authentication and role-based access control
    const authResponse = await authenticate(request)
    if (authResponse) return authResponse

    const user = (request as any).user
    if (!hasRole(user, 'instructor') && !hasRole(user, 'admin')) {
      return NextResponse.json(
        { error: 'Access denied. Required role: admin or instructor' },
        { status: 403 }
      )
    }
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Default to last 6 months if no date range provided
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 6 * 30 * 24 * 60 * 60 * 1000)

    // Get all bookings in the date range
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
      orderBy: {
        scheduledDate: 'asc',
      },
    })

    // Group bookings by month for flight activity data
    const flightActivityMap = new Map<string, { booked: number; completed: number; cancelled: number }>()

    bookings.forEach(booking => {
      const monthKey = new Date(booking.scheduledDate).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
      }).split(' ')[0] // Get just the month abbreviation

      if (!flightActivityMap.has(monthKey)) {
        flightActivityMap.set(monthKey, { booked: 0, completed: 0, cancelled: 0 })
      }

      const current = flightActivityMap.get(monthKey)!
      current.booked += 1

      // Determine status based on booking status and weather
      if (booking.status === 'completed') {
        current.completed += 1
      } else if (booking.status === 'cancelled') {
        current.cancelled += 1
      } else if (booking.weatherReports.some(report => !report.isSafe)) {
        // Count weather conflicts as effectively cancelled for this analysis
        current.cancelled += 1
      }
    })

    // Convert map to array and sort by month
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const flightActivity = Array.from(flightActivityMap.entries())
      .sort(([a], [b]) => monthOrder.indexOf(a) - monthOrder.indexOf(b))
      .map(([month, data]) => ({
        month,
        booked: data.booked,
        completed: data.completed,
        cancelled: data.cancelled,
      }))
      .slice(-6) // Get last 6 months

    // Group weather conflicts by week for weather conflicts data
    const weatherConflictsMap = new Map<string, number>()

    bookings.forEach(booking => {
      const hasConflict = booking.weatherReports.some(report => !report.isSafe)
      if (hasConflict) {
        // Get week number
        const date = new Date(booking.scheduledDate)
        const startOfYear = new Date(date.getFullYear(), 0, 1)
        const weekNumber = Math.ceil(((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)

        const weekKey = `Week ${Math.min(weekNumber, 52)}`
        weatherConflictsMap.set(weekKey, (weatherConflictsMap.get(weekKey) || 0) + 1)
      }
    })

    // Generate weekly data for the last 6 weeks
    const weatherConflicts = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const weekDate = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
      const startOfYear = new Date(weekDate.getFullYear(), 0, 1)
      const weekNumber = Math.ceil(((weekDate.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
      const weekKey = `Week ${weekNumber}`

      weatherConflicts.push({
        week: `Week ${6 - i}`,
        conflicts: weatherConflictsMap.get(weekKey) || 0,
      })
    }

    const performanceData = {
      flightActivity,
      weatherConflicts,
    }

    return NextResponse.json({
      success: true,
      data: performanceData,
    })
  } catch (error) {
    console.error('Analytics performance error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch performance analytics' },
      { status: 500 }
    )
  }
}