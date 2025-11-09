import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/middleware/auth'
import { prisma } from '@/lib/prisma'

// Validation schema for updating a booking
const updateBookingSchema = z.object({
  scheduledDate: z.string().datetime().optional(),
  departureLat: z.number().min(-90).max(90).optional(),
  departureLon: z.number().min(-180).max(180).optional(),
  arrivalLat: z.number().min(-90).max(90).optional(),
  arrivalLon: z.number().min(-180).max(180).optional(),
  notes: z.string().optional(),
  status: z.enum(['scheduled', 'confirmed', 'conflict', 'cancelled', 'completed']).optional()
})

// GET /api/bookings/[id] - Fetch a single booking by ID
export const GET = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const bookingId = parseInt(params.id)

    if (isNaN(bookingId)) {
      return NextResponse.json(
        { error: 'Invalid booking ID' },
        { status: 400 }
      )
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        student: {
          include: { user: { select: { email: true, role: true } } }
        },
        instructor: true,
        aircraft: true,
        weatherReports: {
          orderBy: { createdAt: 'desc' }
        },
        rescheduleSuggestions: {
          orderBy: { createdAt: 'desc' }
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { email: true, role: true }
            }
          }
        }
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(booking)

  } catch (error) {
    console.error('Get booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// PATCH /api/bookings/[id] - Update a booking
export const PATCH = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const bookingId = parseInt(params.id)

    if (isNaN(bookingId)) {
      return NextResponse.json(
        { error: 'Invalid booking ID' },
        { status: 400 }
      )
    }

    const body = await req.json()

    // Validate input
    const validation = updateBookingSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        student: true,
        instructor: true,
        aircraft: true
      }
    })

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    const validatedData = validation.data

    // Convert date string to Date object if provided
    if (validatedData.scheduledDate) {
      updateData.scheduledDate = new Date(validatedData.scheduledDate)
    }

    // Add other fields
    if (validatedData.departureLat !== undefined) updateData.departureLat = validatedData.departureLat
    if (validatedData.departureLon !== undefined) updateData.departureLon = validatedData.departureLon
    if (validatedData.arrivalLat !== undefined) updateData.arrivalLat = validatedData.arrivalLat
    if (validatedData.arrivalLon !== undefined) updateData.arrivalLon = validatedData.arrivalLon
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes
    if (validatedData.status !== undefined) updateData.status = validatedData.status

    // Check for scheduling conflicts if changing date/time or aircraft
    if (updateData.scheduledDate && (updateData.status === 'scheduled' || updateData.status === 'confirmed')) {
      const conflictingBookings = await prisma.booking.findMany({
        where: {
          aircraftId: existingBooking.aircraftId,
          id: { not: bookingId },
          scheduledDate: {
            gte: new Date(updateData.scheduledDate.getTime() - 2 * 60 * 60 * 1000), // 2 hours before
            lte: new Date(updateData.scheduledDate.getTime() + 2 * 60 * 60 * 1000)  // 2 hours after
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
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
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
        bookingId,
        action: 'BOOKING_UPDATED',
        performedBy: (req as any).user.id,
        details: `Updated booking: ${JSON.stringify(updateData)}`
      }
    })

    return NextResponse.json(updatedBooking)

  } catch (error) {
    console.error('Update booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// DELETE /api/bookings/[id] - Cancel/delete a booking
export const DELETE = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const bookingId = parseInt(params.id)

    if (isNaN(bookingId)) {
      return NextResponse.json(
        { error: 'Invalid booking ID' },
        { status: 400 }
      )
    }

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        student: true,
        instructor: true
      }
    })

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Soft delete by updating status to cancelled
    const cancelledBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'cancelled' },
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
        bookingId,
        action: 'BOOKING_CANCELLED',
        performedBy: (req as any).user.id,
        details: `Cancelled booking for ${existingBooking.student?.name}`
      }
    })

    return NextResponse.json({
      message: 'Booking cancelled successfully',
      booking: cancelledBooking
    })

  } catch (error) {
    console.error('Delete booking error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})