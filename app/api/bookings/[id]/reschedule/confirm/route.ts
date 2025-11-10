import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/middleware/auth'
import { rescheduleService } from '@/lib/services/reschedule'
import { prisma } from '@/lib/prisma'
import { notificationService } from '@/lib/services/notification'
import { generateRescheduleConfirmationEmail } from '@/lib/email-templates'
import { logger } from '@/lib/logger'

// Validation schema for confirming a reschedule suggestion
const confirmSuggestionSchema = z.object({
  suggestionId: z.number().int().positive('Suggestion ID must be a positive integer'),
  notes: z.string().max(500).optional()
})

// POST /api/bookings/[id]/reschedule/confirm - Confirm and execute a reschedule suggestion
export const POST = withAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params
    const bookingId = parseInt(id)

    if (isNaN(bookingId)) {
      return NextResponse.json(
        { error: 'Invalid booking ID' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const validation = confirmSuggestionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const { suggestionId, notes } = validation.data
    const user = (req as any).user

    // Verify booking exists and user has access
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        student: {
          include: { user: { select: { email: true, role: true } } }
        },
        instructor: true,
        aircraft: true,
        rescheduleSuggestions: {
          where: { id: suggestionId },
          include: true
        }
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check authorization
    const isOwnBooking = booking.student.user?.email === user.email
    const isAdmin = user.role === 'admin'
    const isInstructor = user.role === 'instructor'

    if (!isOwnBooking && !isAdmin && !isInstructor) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Verify the suggestion exists and belongs to this booking
    const suggestion = booking.rescheduleSuggestions[0]
    if (!suggestion) {
      return NextResponse.json(
        { error: 'Reschedule suggestion not found' },
        { status: 404 }
      )
    }

    if (suggestion.selected) {
      return NextResponse.json(
        { error: 'This suggestion has already been used' },
        { status: 409 }
      )
    }

    // Additional validation: instructors can confirm suggestions for their students
    if (isInstructor && booking.instructorId !== booking.instructor.id) {
      return NextResponse.json(
        { error: 'Instructors can only confirm suggestions for their assigned students' },
        { status: 403 }
      )
    }

    // Confirm the reschedule suggestion
    const result = await rescheduleService.confirmSuggestion({
      suggestionId,
      bookingId,
      confirmedBy: user.email,
      notes
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    // Send email notifications to student and instructor
    try {
      const originalDate = new Date(booking.scheduledDate)
      const newDate = new Date(suggestion.proposedDate)
      const [hours, minutes] = suggestion.proposedTime.split(':').map(Number)
      newDate.setHours(hours, minutes, 0, 0)

      // Prepare recipients
      const recipients = [
        {
          email: booking.student.email,
          name: booking.student.name,
        }
      ]

      // Add instructor if exists
      if (booking.instructor) {
        recipients.push({
          email: booking.instructor.email,
          name: booking.instructor.name,
        })
      }

      // Generate email content
      const emailTemplate = generateRescheduleConfirmationEmail({
        student: booking.student,
        booking: result.updatedBooking, // Use updated booking with new date
        instructorName: booking.instructor?.name,
        selectedSuggestion: suggestion,
        originalDate: originalDate,
        weatherForecast: suggestion.weatherSummary,
      })

      // Send notification
      const notificationResult = await notificationService.sendNotification({
        type: 'reschedule_confirmed',
        recipients,
        subject: emailTemplate.subject,
        htmlContent: emailTemplate.htmlContent,
        textContent: emailTemplate.textContent,
        data: {
          bookingId: booking.id,
          suggestionId: suggestion.id,
          originalDate: originalDate.toISOString(),
          newDate: newDate.toISOString(),
          confirmedBy: user.email,
        },
      })

      if (notificationResult.success) {
        logger.info('Reschedule confirmation notifications sent successfully', {
          bookingId,
          recipientCount: recipients.length,
          messageId: notificationResult.messageId,
        })
      } else {
        logger.error('Failed to send reschedule confirmation notifications', {
          bookingId,
          error: notificationResult.error,
        })
      }
    } catch (emailError) {
      logger.error('Error sending reschedule confirmation notifications', {
        bookingId,
        error: emailError instanceof Error ? emailError.message : 'Unknown error',
      })
      // Don't fail the entire request if email sending fails
    }

    // Create comprehensive audit log entry
    await prisma.auditLog.create({
      data: {
        bookingId,
        action: 'RESCHEDULE_CONFIRMED_BY_USER',
        performedBy: user.email,
        details: `Rescheduled from ${booking.scheduledDate.toISOString()} to ${suggestion.proposedDate.toISOString()} at ${suggestion.proposedTime}. Reason: ${suggestion.reason}. Confidence: ${suggestion.confidence}. Notes: ${notes || 'None'}`
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Booking successfully rescheduled',
      updatedBooking: result.updatedBooking,
      confirmedSuggestion: {
        id: suggestion.id,
        proposedDate: suggestion.proposedDate,
        proposedTime: suggestion.proposedTime,
        reason: suggestion.reason,
        confidence: suggestion.confidence,
        weatherSummary: suggestion.weatherSummary
      },
      confirmedBy: user.email,
      confirmedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Confirm reschedule suggestion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// GET /api/bookings/[id]/reschedule/confirm - Get details for a specific suggestion before confirmation
export const GET = withAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params
    const bookingId = parseInt(id)
    const { searchParams } = new URL(req.url)
    const suggestionId = searchParams.get('suggestionId')

    if (isNaN(bookingId)) {
      return NextResponse.json(
        { error: 'Invalid booking ID' },
        { status: 400 }
      )
    }

    if (!suggestionId) {
      return NextResponse.json(
        { error: 'Suggestion ID is required' },
        { status: 400 }
      )
    }

    const suggestionIdNum = parseInt(suggestionId)
    if (isNaN(suggestionIdNum)) {
      return NextResponse.json(
        { error: 'Invalid suggestion ID' },
        { status: 400 }
      )
    }

    // Verify booking exists and user has access
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        student: {
          include: { user: { select: { email: true, role: true } } }
        },
        instructor: true,
        aircraft: true,
        rescheduleSuggestions: {
          where: { id: suggestionIdNum },
          include: true
        }
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check authorization
    const user = (req as any).user
    const isOwnBooking = booking.student.user?.email === user.email
    const isAdmin = user.role === 'admin'
    const isInstructor = user.role === 'instructor'

    if (!isOwnBooking && !isAdmin && !isInstructor) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Verify the suggestion exists and belongs to this booking
    const suggestion = booking.rescheduleSuggestions[0]
    if (!suggestion) {
      return NextResponse.json(
        { error: 'Reschedule suggestion not found' },
        { status: 404 }
      )
    }

    if (suggestion.selected) {
      return NextResponse.json(
        { error: 'This suggestion has already been used' },
        { status: 409 }
      )
    }

    // Calculate time difference
    const originalDateTime = booking.scheduledDate
    const newDateTime = new Date(suggestion.proposedDate)
    const [hours, minutes] = suggestion.proposedTime.split(':').map(Number)
    newDateTime.setHours(hours, minutes, 0, 0)

    const timeDifference = newDateTime.getTime() - originalDateTime.getTime()
    const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24))
    const hoursDifference = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    return NextResponse.json({
      booking: {
        id: booking.id,
        originalDateTime: booking.scheduledDate.toISOString(),
        student: {
          name: booking.student.name,
          email: booking.student.email,
          trainingLevel: booking.student.trainingLevel
        },
        instructor: {
          name: booking.instructor.name,
          email: booking.instructor.email
        },
        aircraft: {
          model: booking.aircraft.model,
          tailNumber: booking.aircraft.tailNumber
        },
        status: booking.status
      },
      suggestion: {
        id: suggestion.id,
        proposedDate: suggestion.proposedDate.toISOString(),
        proposedTime: suggestion.proposedTime,
        reason: suggestion.reason,
        confidence: suggestion.confidence,
        weatherSummary: suggestion.weatherSummary,
        createdAt: suggestion.createdAt.toISOString()
      },
      changes: {
        timeDifference: {
          days: daysDifference,
          hours: hoursDifference,
          totalHours: Math.floor(timeDifference / (1000 * 60 * 60))
        },
        isLater: timeDifference > 0,
        isSameDay: daysDifference === 0
      },
      permissions: {
        canConfirm: isOwnBooking || isAdmin || (isInstructor && booking.instructorId === booking.instructor.id)
      }
    })

  } catch (error) {
    console.error('Get reschedule suggestion details error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})