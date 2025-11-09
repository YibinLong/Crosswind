import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/middleware/auth'
import { prisma } from '@/lib/prisma'

// Validation schema for creating a student
const createStudentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Invalid email address'),
  trainingLevel: z.enum(['PRIVATE', 'INSTRUMENT', 'COMMERCIAL', 'ATP'], {
    errorMap: () => ({ message: 'Training level must be one of: PRIVATE, INSTRUMENT, COMMERCIAL, ATP' })
  })
})

// GET /api/students - Fetch all students
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)

    // Parse query parameters
    const trainingLevel = searchParams.get('trainingLevel')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build where clause
    const where: any = {}

    if (trainingLevel) where.trainingLevel = trainingLevel

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    const skip = (page - 1) * limit

    // Fetch students with related data
    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          user: {
            select: { email: true, role: true, createdAt: true }
          },
          bookings: {
            where: { status: { in: ['scheduled', 'confirmed'] } },
            orderBy: { scheduledDate: 'asc' },
            take: 5
          },
          _count: {
            select: {
              bookings: true
            }
          }
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit
      }),
      prisma.student.count({ where })
    ])

    return NextResponse.json({
      students,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get students error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// POST /api/students - Create a new student
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json()

    // Validate input
    const validation = createStudentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const { name, email, trainingLevel } = validation.data

    // Check if student with this email already exists
    const existingStudent = await prisma.student.findUnique({
      where: { email },
      include: { user: true }
    })

    if (existingStudent) {
      return NextResponse.json(
        { error: 'Student with this email already exists' },
        { status: 409 }
      )
    }

    // Create student (without user account for now)
    const student = await prisma.student.create({
      data: {
        name,
        email,
        trainingLevel
      },
      include: {
        _count: {
          select: {
            bookings: true
          }
        }
      }
    })

    return NextResponse.json(student, { status: 201 })

  } catch (error) {
    console.error('Create student error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})