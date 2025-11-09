import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/middleware/auth'
import { rescheduleService } from '@/lib/services/reschedule'
import { prisma } from '@/lib/prisma'

// Validation schema for generating reschedule suggestions
const generateSuggestionsSchema = z.object({
  constraints: z.object({
    preferredDaysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
    preferredTimeRanges: z.array(z.object({
      start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    })).optional(),
    maxDaysInFuture: z.number().int().min(1).max(30).optional(),
    availableAircraftIds: z.array(z.number().int().positive()).optional(),
    availableInstructorIds: z.array(z.number().int().positive()).optional()
  }).optional(),
  forceRegenerate: z.boolean().optional() // Override existing suggestions
})

// GET /api/bookings/[id]/reschedule - Fetch existing reschedule suggestions
export const GET = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const bookingId = parseInt(params.id)

    if (isNaN(bookingId)) {
      return NextResponse.json(
        { error: 'Invalid booking ID' },
        { status: 400 }
      )
    }

    // Verify booking exists and user has access
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        student: {
          include: { user: { select: { email: true, role: true } } }
        }
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check authorization - user can access their own bookings or admins can access all
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

    // Get existing suggestions
    const suggestions = await rescheduleService.getExistingSuggestions(bookingId)

    return NextResponse.json({
      bookingId,
      status: booking.status,
      hasConflict: booking.status === 'conflict',
      suggestions,
      count: suggestions.length
    })

  } catch (error) {
    console.error('Get reschedule suggestions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// POST /api/bookings/[id]/reschedule - Generate new AI reschedule suggestions
export const POST = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const bookingId = parseInt(params.id)

    if (isNaN(bookingId)) {
      return NextResponse.json(
        { error: 'Invalid booking ID' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const validation = generateSuggestionsSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors
        },
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
        aircraft: true
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check authorization - user can access their own bookings or admins can access all
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

    // Verify booking has a conflict status (unless force regenerate is requested)
    if (booking.status !== 'conflict' && !validation.data.forceRegenerate) {
      return NextResponse.json(
        {
          error: `Booking must have 'conflict' status to generate reschedule suggestions. Current status: ${booking.status}`,
          suggestion: 'Set forceRegenerate to true to override this check'
        },
        { status: 400 }
      )
    }

    // Check if there are existing unselected suggestions
    const existingSuggestions = await rescheduleService.getExistingSuggestions(bookingId)
    if (existingSuggestions.length > 0 && !validation.data.forceRegenerate) {
      return NextResponse.json(
        {
          error: 'Existing reschedule suggestions found for this booking',
          existingCount: existingSuggestions.length,
          suggestion: 'Set forceRegenerate to true to generate new suggestions'
        },
        { status: 409 }
      )
    }

    // If force regenerate, cancel existing suggestions
    if (validation.data.forceRegenerate && existingSuggestions.length > 0) {
      await rescheduleService.cancelSuggestions(bookingId, user.email)
    }

    // Generate new suggestions
    const result = await rescheduleService.generateSuggestions({
      bookingId,
      constraints: validation.data.constraints,
      requestedBy: user.email
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        bookingId,
        action: 'AI_RESCHEDULE_REQUESTED',
        performedBy: user.email,
        details: `Requested AI reschedule suggestions. Generated ${result.suggestions?.length || 0} options with average confidence: ${result.suggestions ? (result.suggestions.reduce((sum, s) => sum + s.confidence, 0) / result.suggestions.length).toFixed(2) : 'N/A'}`
      }
    })

    return NextResponse.json({
      success: true,
      bookingId,
      suggestions: result.suggestions,
      count: result.suggestions?.length || 0,
      message: `Generated ${result.suggestions?.length || 0} AI-powered reschedule suggestions`
    })

  } catch (error) {
    console.error('Generate reschedule suggestions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// DELETE /api/bookings/[id]/reschedule - Cancel existing suggestions
export const DELETE = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const bookingId = parseInt(params.id)

    if (isNaN(bookingId)) {
      return NextResponse.json(
        { error: 'Invalid booking ID' },
        { status: 400 }
      )
    }

    // Verify booking exists and user has access
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        student: {
          include: { user: { select: { email: true, role: true } } }
        }
      }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check authorization - user can access their own bookings or admins can access all
    const user = (req as any).user
    const isOwnBooking = booking.student.user?.email === user.email
    const isAdmin = user.role === 'admin'

    if (!isOwnBooking && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Cancel existing suggestions
    await rescheduleService.cancelSuggestions(bookingId, user.email)

    return NextResponse.json({
      success: true,
      message: 'All pending reschedule suggestions have been cancelled'
    })

  } catch (error) {
    console.error('Cancel reschedule suggestions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})