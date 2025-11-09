import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/middleware/auth'
import { prisma } from '@/lib/prisma'

// Validation schema for creating a booking
const createBookingSchema = z.object({
  studentId: z.number().int().positive('Student ID must be a positive integer'),
  instructorId: z.number().int().positive('Instructor ID must be a positive integer'),
  aircraftId: z.number().int().positive('Aircraft ID must be a positive integer'),
  scheduledDate: z.string().datetime('Invalid datetime format'),
  departureLat: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  departureLon: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
  arrivalLat: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  arrivalLon: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
  notes: z.string().optional()
})

// GET /api/bookings - Fetch all bookings with optional filters
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)

    // Parse query parameters
    const status = searchParams.get('status')
    const studentId = searchParams.get('studentId')
    const instructorId = searchParams.get('instructorId')
    const aircraftId = searchParams.get('aircraftId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const upcoming = searchParams.get('upcoming') === 'true'

    // Build where clause
    const where: any = {}

    if (status) where.status = status
    if (studentId) where.studentId = parseInt(studentId)
    if (instructorId) where.instructorId = parseInt(instructorId)
    if (aircraftId) where.aircraftId = parseInt(aircraftId)

    // Date range filtering
    if (startDate || endDate) {
      where.scheduledDate = {}
      if (startDate) where.scheduledDate.gte = new Date(startDate)
      if (endDate) where.scheduledDate.lte = new Date(endDate)
    }

    // Upcoming bookings filter
    if (upcoming) {
      where.scheduledDate = {
        ...where.scheduledDate,
        gte: new Date()
      }
      where.status = { in: ['scheduled', 'confirmed'] }
    }

    const skip = (page - 1) * limit

    // Fetch bookings with related data
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          student: {
            include: { user: { select: { email: true, role: true } } }
          },
          instructor: true,
          aircraft: true,
          weatherReports: {
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          rescheduleSuggestions: {
            where: { selected: false },
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { scheduledDate: 'asc' },
        skip,
        take: limit
      }),
      prisma.booking.count({ where })
    ])

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get bookings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// POST /api/bookings - Create a new booking
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json()

    // Validate input
    const validation = createBookingSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const {
      studentId,
      instructorId,
      aircraftId,
      scheduledDate,
      departureLat,
      departureLon,
      arrivalLat,
      arrivalLon,
      notes
    } = validation.data

    // Check if student, instructor, and aircraft exist
    const [student, instructor, aircraft] = await Promise.all([
      prisma.student.findUnique({ where: { id: studentId } }),
      prisma.instructor.findUnique({ where: { id: instructorId } }),
      prisma.aircraft.findUnique({ where: { id: aircraftId } })
    ])

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    if (!instructor) {
      return NextResponse.json(
        { error: 'Instructor not found' },
        { status: 404 }
      )
    }

    if (!aircraft) {
      return NextResponse.json(
        { error: 'Aircraft not found' },
        { status: 404 }
      )
    }

    // Check if aircraft is available
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        aircraftId,
        scheduledDate: {
          gte: new Date(new Date(scheduledDate).getTime() - 2 * 60 * 60 * 1000), // 2 hours before
          lte: new Date(new Date(scheduledDate).getTime() + 2 * 60 * 60 * 1000)  // 2 hours after
        },
        status: { in: ['scheduled', 'confirmed'] }
      }
    })

    if (conflictingBookings.length > 0) {
      return NextResponse.json(
        { error: 'Aircraft is already booked for this time slot' },
        { status: 409 }
      )
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        studentId,
        instructorId,
        aircraftId,
        scheduledDate: new Date(scheduledDate),
        departureLat,
        departureLon,
        arrivalLat,
        arrivalLon,
        notes,
        status: 'scheduled'
      },
      include: {
        student: {
          include: { user: { select: { email: true, role: true } } }
        },
        instructor: true,
        aircraft: true
      }
    })

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        bookingId: booking.id,
        action: 'BOOKING_CREATED',
        performedBy: (req as any).user.email,
        details: `Created booking for ${student.name} with ${instructor.name}`
      }
    })

    return NextResponse.json(booking, { status: 201 })

  } catch (error) {
    console.error('Create booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})