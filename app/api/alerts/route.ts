import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/middleware/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

// Query schema for filtering alerts
const alertsQuerySchema = z.object({
  status: z.enum(['conflict', 'all']).optional().default('conflict'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  studentId: z.coerce.number().int().positive().optional(),
  instructorId: z.coerce.number().int().positive().optional(),
})

// GET /api/alerts - Fetch active weather conflicts and alerts
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const query = Object.fromEntries(searchParams.entries())
    const validation = alertsQuerySchema.safeParse(query)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const { status, limit, offset, studentId, instructorId } = validation.data
    const user = (req as any).user

    logger.info('Fetching alerts', {
      userId: user.email,
      userRole: user.role,
      filters: { status, limit, offset, studentId, instructorId }
    })

    // Build where clause based on user role and filters
    const whereClause: any = {}

    // Filter by booking status
    if (status === 'conflict') {
      whereClause.status = 'conflict'
    }

    // Filter by specific student or instructor
    if (studentId) {
      whereClause.studentId = studentId
    }
    if (instructorId) {
      whereClause.instructorId = instructorId
    }

    // Apply role-based filtering
    if (user.role === 'student') {
      // Students can only see their own bookings
      const student = await prisma.student.findUnique({
        where: { email: user.email },
        select: { id: true }
      })

      if (!student) {
        return NextResponse.json(
          { error: 'Student profile not found' },
          { status: 404 }
        )
      }

      whereClause.studentId = student.id
    } else if (user.role === 'instructor') {
      // Instructors can see bookings assigned to them
      const instructor = await prisma.instructor.findUnique({
        where: { email: user.email },
        select: { id: true }
      })

      if (!instructor) {
        return NextResponse.json(
          { error: 'Instructor profile not found' },
          { status: 404 }
        )
      }

      whereClause.instructorId = instructor.id
    }
    // Admins can see all bookings (no additional filtering needed)

    // Fetch bookings with weather reports and related data
    const [bookings, totalCount] = await Promise.all([
      prisma.booking.findMany({
        where: {
          ...whereClause,
          // Only include bookings scheduled in the next 7 days
          scheduledDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
          }
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              trainingLevel: true,
              phone: true
            }
          },
          instructor: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          aircraft: {
            select: {
              id: true,
              tailNumber: true,
              model: true,
              status: true
            }
          },
          weatherReports: {
            where: {
              // Get the most recent weather report for each booking
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          rescheduleSuggestions: {
            where: { selected: false }, // Only unselected suggestions
            orderBy: { createdAt: 'desc' },
            take: 3
          },
          _count: {
            select: {
              rescheduleSuggestions: true
            }
          }
        },
        orderBy: [
          { status: 'desc' }, // Conflicts first
          { scheduledDate: 'asc' } // Earlier flights first
        ],
        take: limit,
        skip: offset
      }),
      prisma.booking.count({ where: whereClause })
    ])

    // Format alerts for the WeatherAlerts component
    const alerts = bookings.map(booking => {
      const weatherReport = booking.weatherReports[0]
      const isConflict = booking.status === 'conflict'
      const hasRescheduleOptions = booking.rescheduleSuggestions.length > 0

      return {
        id: booking.id,
        type: isConflict ? 'weather_conflict' : 'reminder',
        severity: isConflict ? 'high' : 'medium',
        title: isConflict
          ? `Weather Conflict - ${booking.student.name}`
          : `Flight Reminder - ${booking.student.name}`,
        message: isConflict
          ? `Weather conditions violate minimums for ${booking.student.trainingLevel} training level.`
          : `Flight scheduled in ${Math.ceil((booking.scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60))} hours.`,
        flight: {
          id: booking.id,
          student: booking.student,
          instructor: booking.instructor,
          aircraft: booking.aircraft,
          scheduledDate: booking.scheduledDate.toISOString(),
          status: booking.status,
          departure: {
            lat: booking.departureLat,
            lon: booking.departureLon
          },
          arrival: booking.arrivalLat && booking.arrivalLon ? {
            lat: booking.arrivalLat,
            lon: booking.arrivalLon
          } : undefined
        },
        weather: weatherReport ? {
          windKts: weatherReport.windKts,
          windGustKts: weatherReport.windGustKts,
          visibility: weatherReport.visibility,
          ceilingFt: weatherReport.ceilingFt,
          condition: weatherReport.condition,
          temperature: weatherReport.temperature,
          isSafe: weatherReport.isSafe,
          violatedMinimums: weatherReport.violatedMinimums,
          reportTime: weatherReport.createdAt.toISOString()
        } : null,
        reschedule: hasRescheduleOptions ? {
          availableOptions: booking.rescheduleSuggestions.length,
          suggestions: booking.rescheduleSuggestions.map(suggestion => ({
            id: suggestion.id,
            proposedDate: suggestion.proposedDate.toISOString(),
            proposedTime: suggestion.proposedTime,
            weatherSummary: suggestion.weatherSummary,
            confidence: suggestion.confidence,
            reason: suggestion.reason
          }))
        } : null,
        actions: isConflict ? [
          {
            label: 'View Reschedule Options',
            action: 'view_reschedule',
            url: `/dashboard/flights/${booking.id}/reschedule`
          },
          {
            label: 'Contact Instructor',
            action: 'contact_instructor',
            url: `mailto:${booking.instructor?.email || ''}`
          }
        ] : [
          {
            label: 'View Details',
            action: 'view_details',
            url: `/dashboard/flights/${booking.id}`
          }
        ],
        timestamp: booking.scheduledDate.toISOString(),
        createdAt: booking.createdAt.toISOString()
      }
    })

    // Calculate summary statistics
    const summary = {
      totalAlerts: alerts.length,
      conflictCount: alerts.filter(alert => alert.type === 'weather_conflict').length,
      reminderCount: alerts.filter(alert => alert.type === 'reminder').length,
      pendingReschedules: alerts.filter(alert => alert.reschedule?.availableOptions).length,
      hasRescheduleOptions: alerts.length > 0
    }

    logger.info('Alerts fetched successfully', {
      userId: user.email,
      alertCount: alerts.length,
      conflictCount: summary.conflictCount,
      summary
    })

    return NextResponse.json({
      success: true,
      alerts,
      summary,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      filters: {
        status,
        studentId,
        instructorId
      }
    })

  } catch (error) {
    logger.error('Error fetching alerts', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// POST /api/alerts/refresh - Manually trigger weather monitoring for immediate updates
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const user = (req as any).user

    // Only admins can manually trigger weather monitoring
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      )
    }

    logger.info('Manual weather monitoring triggered', {
      triggeredBy: user.email
    })

    // Import weather monitoring service
    const { weatherMonitorService } = await import('@/lib/services/weatherMonitor')

    // Run weather monitoring in the background
    weatherMonitorService.checkAllUpcomingBookings()
      .then(result => {
        logger.info('Manual weather monitoring completed', {
          triggeredBy: user.email,
          result: {
            totalBookings: result.totalBookings,
            bookingsChecked: result.bookingsChecked,
            conflictsDetected: result.conflictsDetected,
            executionTime: result.executionTime
          }
        })
      })
      .catch(error => {
        logger.error('Manual weather monitoring failed', {
          triggeredBy: user.email,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      })

    return NextResponse.json({
      success: true,
      message: 'Weather monitoring initiated. Results will be available shortly.',
      triggeredBy: user.email,
      triggeredAt: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Error triggering manual weather monitoring', {
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})