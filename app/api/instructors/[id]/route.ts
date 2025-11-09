import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/middleware/auth'
import { prisma } from '@/lib/prisma'

// Validation schema for updating an instructor
const updateInstructorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  certifications: z.string().optional()
})

// GET /api/instructors/[id] - Fetch a single instructor by ID
export const GET = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const instructorId = parseInt(params.id)

    if (isNaN(instructorId)) {
      return NextResponse.json(
        { error: 'Invalid instructor ID' },
        { status: 400 }
      )
    }

    const instructor = await prisma.instructor.findUnique({
      where: { id: instructorId },
      include: {
        bookings: {
          include: {
            student: true,
            aircraft: true,
            weatherReports: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          },
          orderBy: { scheduledDate: 'desc' }
        },
        _count: {
          select: {
            bookings: {
              where: { status: { in: ['scheduled', 'confirmed'] } }
            }
          }
        }
      }
    })

    if (!instructor) {
      return NextResponse.json(
        { error: 'Instructor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(instructor)

  } catch (error) {
    console.error('Get instructor error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// PATCH /api/instructors/[id] - Update an instructor
export const PATCH = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const instructorId = parseInt(params.id)

    if (isNaN(instructorId)) {
      return NextResponse.json(
        { error: 'Invalid instructor ID' },
        { status: 400 }
      )
    }

    const body = await req.json()

    // Validate input
    const validation = updateInstructorSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    // Check if instructor exists
    const existingInstructor = await prisma.instructor.findUnique({
      where: { id: instructorId }
    })

    if (!existingInstructor) {
      return NextResponse.json(
        { error: 'Instructor not found' },
        { status: 404 }
      )
    }

    const validatedData = validation.data

    // Check if email is being changed and if it's already in use
    if (validatedData.email && validatedData.email !== existingInstructor.email) {
      const emailExists = await prisma.instructor.findUnique({
        where: { email: validatedData.email }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already in use by another instructor' },
          { status: 409 }
        )
      }
    }

    // Update instructor
    const updatedInstructor = await prisma.instructor.update({
      where: { id: instructorId },
      data: validatedData,
      include: {
        _count: {
          select: {
            bookings: {
              where: { status: { in: ['scheduled', 'confirmed'] } }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedInstructor)

  } catch (error) {
    console.error('Update instructor error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// DELETE /api/instructors/[id] - Delete an instructor
export const DELETE = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const instructorId = parseInt(params.id)

    if (isNaN(instructorId)) {
      return NextResponse.json(
        { error: 'Invalid instructor ID' },
        { status: 400 }
      )
    }

    // Check if instructor exists
    const existingInstructor = await prisma.instructor.findUnique({
      where: { id: instructorId },
      include: {
        bookings: {
          where: { status: { in: ['scheduled', 'confirmed'] } }
        }
      }
    })

    if (!existingInstructor) {
      return NextResponse.json(
        { error: 'Instructor not found' },
        { status: 404 }
      )
    }

    // Check if instructor has active bookings
    if (existingInstructor.bookings.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete instructor with active bookings. Cancel or complete bookings first.' },
        { status: 409 }
      )
    }

    // Delete instructor (cascade will handle related records)
    await prisma.instructor.delete({
      where: { id: instructorId }
    })

    return NextResponse.json({
      message: 'Instructor deleted successfully'
    })

  } catch (error) {
    console.error('Delete instructor error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})