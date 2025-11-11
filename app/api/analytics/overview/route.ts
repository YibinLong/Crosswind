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

    // Default to last 30 days if no date range provided
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)

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
        rescheduleSuggestions: true,
      },
    })

    // Get previous period data for trend calculation
    const previousStart = new Date(start.getTime() - (end.getTime() - start.getTime()))
    const previousEnd = start
    const previousBookings = await prisma.booking.findMany({
      where: {
        createdAt: {
          gte: previousStart,
          lte: previousEnd,
        },
      },
      include: {
        weatherReports: true,
        rescheduleSuggestions: true,
      },
    })

    // Calculate current period metrics
    const totalFlights = bookings.length
    const weatherConflicts = bookings.filter(booking =>
      booking.weatherReports.some(report => !report.isSafe)
    ).length
    const successfulReschedules = bookings.filter(booking =>
      booking.rescheduleSuggestions.some(suggestion => suggestion.selected)
    ).length

    // Calculate average reschedule time (in minutes)
    const rescheduleTimes = bookings
      .filter(booking => {
        const selectedSuggestion = booking.rescheduleSuggestions.find(s => s.selected)
        return selectedSuggestion && booking.createdAt
      })
      .map(booking => {
        const selectedSuggestion = booking.rescheduleSuggestions.find(s => s.selected)
        const createdTime = new Date(booking.createdAt).getTime()
        const suggestionTime = new Date(selectedSuggestion!.createdAt).getTime()
        return Math.round((suggestionTime - createdTime) / (1000 * 60))
      })

    const avgRescheduleTime = rescheduleTimes.length > 0
      ? Math.round(rescheduleTimes.reduce((a, b) => a + b, 0) / rescheduleTimes.length)
      : 0

    // Calculate previous period metrics for trends
    const previousTotalFlights = previousBookings.length
    const previousConflicts = previousBookings.filter(booking =>
      booking.weatherReports.some(report => !report.isSafe)
    ).length

    const previousRescheduleTimes = previousBookings
      .filter(booking => {
        const selectedSuggestion = booking.rescheduleSuggestions.find(s => s.selected)
        return selectedSuggestion && booking.createdAt
      })
      .map(booking => {
        const selectedSuggestion = booking.rescheduleSuggestions.find(s => s.selected)
        const createdTime = new Date(booking.createdAt).getTime()
        const suggestionTime = new Date(selectedSuggestion!.createdAt).getTime()
        return Math.round((suggestionTime - createdTime) / (1000 * 60))
      })

    const previousAvgRescheduleTime = previousRescheduleTimes.length > 0
      ? Math.round(previousRescheduleTimes.reduce((a, b) => a + b, 0) / previousRescheduleTimes.length)
      : 0

    // Calculate trend percentages
    const totalFlightsChange = previousTotalFlights > 0
      ? ((totalFlights - previousTotalFlights) / previousTotalFlights * 100).toFixed(1)
      : '0.0'

    const conflictsChange = previousConflicts > 0
      ? ((weatherConflicts - previousConflicts) / previousConflicts * 100).toFixed(1)
      : '0.0'

    const rescheduleTimeChange = previousAvgRescheduleTime > 0
      ? ((avgRescheduleTime - previousAvgRescheduleTime) / previousAvgRescheduleTime * 100).toFixed(1)
      : '0.0'

    const successRate = weatherConflicts > 0
      ? (successfulReschedules / weatherConflicts * 100).toFixed(1)
      : '0.0'

    const overviewData = {
      totalFlights,
      weatherConflicts,
      successfulReschedules,
      avgRescheduleTime,
      successRate: `${successRate}% success rate`,
      trends: {
        totalFlightsChange: `${totalFlightsChange.startsWith('-') ? '' : '+'}${totalFlightsChange}%`,
        conflictsChange: `${conflictsChange.startsWith('-') ? '' : '+'}${conflictsChange}%`,
        rescheduleTimeChange: `${rescheduleTimeChange.startsWith('-') ? '' : '-'}${Math.abs(parseFloat(rescheduleTimeChange)).toFixed(1)}%`,
      },
    }

    return NextResponse.json({
      success: true,
      data: overviewData,
    })
  } catch (error) {
    console.error('Analytics overview error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics overview' },
      { status: 500 }
    )
  }
}