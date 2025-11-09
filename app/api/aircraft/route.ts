import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/middleware/auth'
import { prisma } from '@/lib/prisma'

// Validation schema for creating an aircraft
const createAircraftSchema = z.object({
  tailNumber: z.string().min(1, 'Tail number is required'),
  model: z.string().min(1, 'Model is required'),
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'UNAVAILABLE'], {
    errorMap: () => ({ message: 'Status must be one of: AVAILABLE, IN_USE, MAINTENANCE, UNAVAILABLE' })
  })
})

// GET /api/aircraft - Fetch all aircraft
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)

    // Parse query parameters
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const available = searchParams.get('available') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build where clause
    const where: any = {}

    if (status) where.status = status

    if (search) {
      where.OR = [
        { tailNumber: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } }
      ]
    }

    const skip = (page - 1) * limit

    // Fetch aircraft with related data
    const [aircraft, total] = await Promise.all([
      prisma.aircraft.findMany({
        where,
        include: {
          bookings: {
            where: {
              status: { in: ['scheduled', 'confirmed'] },
              scheduledDate: { gte: new Date() }
            },
            orderBy: { scheduledDate: 'asc' },
            take: available ? undefined : 3
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
        orderBy: { tailNumber: 'asc' },
        skip,
        take: limit
      }),
      prisma.aircraft.count({ where })
    ])

    // Filter aircraft based on availability if requested
    let filteredAircraft = aircraft
    if (available) {
      filteredAircraft = aircraft.filter(ac => ac.status === 'AVAILABLE' && ac.bookings.length === 0)
    }

    return NextResponse.json({
      aircraft: filteredAircraft,
      pagination: {
        page,
        limit,
        total: available ? filteredAircraft.length : total,
        pages: Math.ceil((available ? filteredAircraft.length : total) / limit)
      }
    })

  } catch (error) {
    console.error('Get aircraft error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// POST /api/aircraft - Create a new aircraft
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body = await req.json()

    // Validate input
    const validation = createAircraftSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const { tailNumber, model, status } = validation.data

    // Check if aircraft with this tail number already exists
    const existingAircraft = await prisma.aircraft.findUnique({
      where: { tailNumber }
    })

    if (existingAircraft) {
      return NextResponse.json(
        { error: 'Aircraft with this tail number already exists' },
        { status: 409 }
      )
    }

    // Create aircraft
    const aircraft = await prisma.aircraft.create({
      data: {
        tailNumber,
        model,
        status
      },
      include: {
        _count: {
          select: {
            bookings: true
          }
        }
      }
    })

    return NextResponse.json(aircraft, { status: 201 })

  } catch (error) {
    console.error('Create aircraft error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})