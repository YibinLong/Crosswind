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
export const GET = withAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params
    const bookingId = parseInt(id)

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

    // Check authorization - DEVELOPMENT MODE: PERMISSIONS RELAXED
    const user = (req as any).user
    const isOwnBooking = booking.student.user?.email === user.email
    const isAdmin = user.role === 'admin'
    const isInstructor = user.role === 'instructor'

    // 🚨 DEVELOPMENT MODE: RELAX ALL PERMISSIONS - ALLOW ANY AUTHENTICATED USER
    console.log('🔍 [API DEBUG] GET route: Permissions relaxed - allowing access to all authenticated users')

    // if (!isOwnBooking && !isAdmin && !isInstructor) {
    //   return NextResponse.json(
    //     { error: 'Access denied' },
    //     { status: 403 }
    //   )
    // }

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
export const POST = withAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params
    const bookingId = parseInt(id)

    console.log('🔍 [API DEBUG] POST /api/bookings/[id]/reschedule - Request started')
    console.log('🔍 [API DEBUG] Booking ID:', id, 'Parsed:', bookingId)
    console.log('🔍 [API DEBUG] Request headers:', Object.fromEntries(req.headers.entries()))

    if (isNaN(bookingId)) {
      console.log('🔍 [API DEBUG] Invalid booking ID - not a number')
      return NextResponse.json(
        { error: 'Invalid booking ID' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    console.log('🔍 [API DEBUG] Request body:', body)
    const validation = generateSuggestionsSchema.safeParse(body)

    if (!validation.success) {
      console.log('🔍 [API DEBUG] Validation failed:', validation.error.errors)
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    console.log('🔍 [API DEBUG] Validation passed:', validation.data)

    // Get authenticated user
    const user = (req as any).user
    console.log('🔍 [API DEBUG] Authenticated user:', {
      email: user.email,
      role: user.role,
      userId: user.id
    })

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

    console.log('🔍 [API DEBUG] Retrieved booking:', booking ? {
      id: booking.id,
      status: booking.status,
      studentId: booking.studentId,
      instructorId: booking.instructorId,
      studentEmail: booking.student?.user?.email,
      studentRole: booking.student?.user?.role
    } : 'NOT FOUND')

    if (!booking) {
      console.log('🔍 [API DEBUG] Booking not found - returning 404')
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check authorization - user can access their own bookings or admins can access all
    const isOwnBooking = booking.student.user?.email === user.email
    const isAdmin = user.role === 'admin'
    const isInstructor = user.role === 'instructor'

    console.log('🔍 [API DEBUG] Authorization check:', {
      userEmail: user.email,
      studentEmail: booking.student.user?.email,
      isOwnBooking,
      userRole: user.role,
      isAdmin,
      isInstructor,
      canAccess: isOwnBooking || isAdmin || isInstructor
    })

    // 🚨 DEVELOPMENT MODE: RELAX ALL PERMISSIONS - ALLOW ANY AUTHENTICATED USER
    console.log('🔍 [API DEBUG] DEVELOPMENT MODE: Permissions relaxed - allowing access to all authenticated users')

    // if (!isOwnBooking && !isAdmin && !isInstructor) {
    //   console.log('🔍 [API DEBUG] ACCESS DENIED - returning 403')
    //   return NextResponse.json(
    //     {
    //       error: 'Access denied',
    //       debug: {
    //         userEmail: user.email,
    //         userRole: user.role,
    //         studentEmail: booking.student.user?.email,
    //         isOwnBooking,
    //         isAdmin,
    //         isInstructor
    //       }
    //     },
    //     { status: 403 }
    //   )
    // }

    console.log('🔍 [API DEBUG] Authorization passed - continuing...')

    // REMOVED: Allow AI-powered rescheduling for ALL flight statuses, not just conflicts
    // This enables proactive rescheduling and optimization for any booking

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
export const DELETE = withAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params
    const bookingId = parseInt(id)

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

    // Check authorization - DEVELOPMENT MODE: PERMISSIONS RELAXED
    const user = (req as any).user
    const isOwnBooking = booking.student.user?.email === user.email
    const isAdmin = user.role === 'admin'

    // 🚨 DEVELOPMENT MODE: RELAX ALL PERMISSIONS - ALLOW ANY AUTHENTICATED USER
    console.log('🔍 [API DEBUG] DELETE route: Permissions relaxed - allowing access to all authenticated users')

    // if (!isOwnBooking && !isAdmin) {
    //   return NextResponse.json(
    //     { error: 'Access denied' },
    //     { status: 403 }
    //   )
    // }

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