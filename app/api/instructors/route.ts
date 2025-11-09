import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/middleware/auth'
import { prisma } from '@/lib/prisma'

// Validation schema for creating an instructor
const createInstructorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  certifications: z.string().optional()
})

// GET /api/instructors - Fetch all instructors
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)

    // Parse query parameters
    const search = searchParams.get('search')
    const available = searchParams.get('available') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    const skip = (page - 1) * limit

    // Fetch instructors with related data
    const [instructors, total] = await Promise.all([
      prisma.instructor.findMany({
        where,
        include: {
          bookings: {
            where: {
              status: { in: ['scheduled', 'confirmed'] },
              scheduledDate: { gte: new Date() }
            },
            orderBy: { scheduledDate: 'asc' },
            take: available ? undefined : 5
          },
          _count: {
            select: {
              bookings: {
                where: {
                  status: { in: ['scheduled', 'confirmed'] },
                  scheduledDate: { gte: new Date() }
                }
              }
            }
          }
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit
      }),
      prisma.instructor.count({ where })
    ])

    // Filter instructors based on availability if requested
    let filteredInstructors = instructors
    if (available) {
      filteredInstructors = instructors.filter(instructor => instructor.bookings.length === 0)
    }

    return NextResponse.json({
      instructors: filteredInstructors,
      pagination: {
        page,
        limit,
        total: available ? filteredInstructors.length : total,
        pages: Math.ceil((available ? filteredInstructors.length : total) / limit)
      }
    })

  } catch (error) {
    console.error('Get instructors error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// POST /api/instructors - Create a new instructor
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json()

    // Validate input
    const validation = createInstructorSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const { name, email, phone, certifications } = validation.data

    // Check if instructor with this email already exists
    const existingInstructor = await prisma.instructor.findUnique({
      where: { email }
    })

    if (existingInstructor) {
      return NextResponse.json(
        { error: 'Instructor with this email already exists' },
        { status: 409 }
      )
    }

    // Create instructor
    const instructor = await prisma.instructor.create({
      data: {
        name,
        email,
        phone,
        certifications
      },
      include: {
        _count: {
          select: {
            bookings: true
          }
        }
      }
    })

    return NextResponse.json(instructor, { status: 201 })

  } catch (error) {
    console.error('Create instructor error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})