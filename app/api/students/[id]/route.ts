import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/middleware/auth'
import { prisma } from '@/lib/prisma'

// Validation schema for updating a student
const updateStudentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long').optional(),
  email: z.string().email('Invalid email address').optional(),
  trainingLevel: z.enum(['PRIVATE', 'INSTRUMENT', 'COMMERCIAL', 'ATP']).optional()
})

// GET /api/students/[id] - Fetch a single student by ID
export const GET = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const studentId = parseInt(params.id)

    if (isNaN(studentId)) {
      return NextResponse.json(
        { error: 'Invalid student ID' },
        { status: 400 }
      )
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: { email: true, role: true, createdAt: true }
        },
        bookings: {
          include: {
            instructor: true,
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

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(student)

  } catch (error) {
    console.error('Get student error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// PATCH /api/students/[id] - Update a student
export const PATCH = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const studentId = parseInt(params.id)

    if (isNaN(studentId)) {
      return NextResponse.json(
        { error: 'Invalid student ID' },
        { status: 400 }
      )
    }

    const body = await req.json()

    // Validate input
    const validation = updateStudentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id: studentId }
    })

    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    const validatedData = validation.data

    // Check if email is being changed and if it's already in use
    if (validatedData.email && validatedData.email !== existingStudent.email) {
      const emailExists = await prisma.student.findUnique({
        where: { email: validatedData.email }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already in use by another student' },
          { status: 409 }
        )
      }
    }

    // Update student
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: validatedData,
      include: {
        user: {
          select: { email: true, role: true, createdAt: true }
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

    return NextResponse.json(updatedStudent)

  } catch (error) {
    console.error('Update student error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// DELETE /api/students/[id] - Delete a student
export const DELETE = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const studentId = parseInt(params.id)

    if (isNaN(studentId)) {
      return NextResponse.json(
        { error: 'Invalid student ID' },
        { status: 400 }
      )
    }

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        bookings: {
          where: { status: { in: ['scheduled', 'confirmed'] } }
        }
      }
    })

    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Check if student has active bookings
    if (existingStudent.bookings.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete student with active bookings. Cancel or complete bookings first.' },
        { status: 409 }
      )
    }

    // Delete student (cascade will handle related records)
    await prisma.student.delete({
      where: { id: studentId }
    })

    return NextResponse.json({
      message: 'Student deleted successfully'
    })

  } catch (error) {
    console.error('Delete student error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})