import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/auth'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Default to today's date range if not provided
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const start = startDate ? new Date(startDate) : today
    const end = endDate ? new Date(endDate) : tomorrow

    // Get today's flights
    const todayFlights = await prisma.booking.count({
      where: {
        scheduledDate: {
          gte: today,
          lt: tomorrow
        },
        status: {
          in: ['scheduled', 'confirmed']
        }
      }
    })

    // Get weekly scheduled flights (next 7 days)
    const weekEnd = new Date(today)
    weekEnd.setDate(weekEnd.getDate() + 7)

    const weeklyScheduled = await prisma.booking.count({
      where: {
        scheduledDate: {
          gte: today,
          lte: weekEnd
        },
        status: {
          in: ['scheduled', 'confirmed']
        }
      }
    })

    // Get active conflicts
    const activeConflicts = await prisma.booking.count({
      where: {
        status: 'conflict'
      }
    })

    // Calculate completion rate
    const totalCompleted = await prisma.booking.count({
      where: {
        status: 'completed'
      }
    })

    const totalCancelled = await prisma.booking.count({
      where: {
        status: 'cancelled'
      }
    })

    const totalBookings = await prisma.booking.count({
      where: {
        status: {
          in: ['completed', 'cancelled', 'confirmed', 'scheduled']
        }
      }
    })

    const completionRate = totalBookings > 0
      ? Math.round((totalCompleted / totalBookings) * 100)
      : 0

    // Get total counts for resources
    const totalStudents = await prisma.student.count()
    const totalInstructors = await prisma.instructor.count()
    const totalAircraft = await prisma.aircraft.count({
      where: {
        status: 'available'
      }
    })

    const stats = {
      todayFlights,
      weeklyScheduled,
      activeConflicts,
      completionRate,
      totalStudents,
      totalInstructors,
      totalAircraft
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
})