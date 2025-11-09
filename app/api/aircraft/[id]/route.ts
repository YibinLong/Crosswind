import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/lib/middleware/auth'
import { prisma } from '@/lib/prisma'

// Validation schema for updating an aircraft
const updateAircraftSchema = z.object({
  tailNumber: z.string().min(1, 'Tail number is required').optional(),
  model: z.string().min(1, 'Model is required').optional(),
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'UNAVAILABLE']).optional()
})

// GET /api/aircraft/[id] - Fetch a single aircraft by ID
export const GET = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const aircraftId = parseInt(params.id)

    if (isNaN(aircraftId)) {
      return NextResponse.json(
        { error: 'Invalid aircraft ID' },
        { status: 400 }
      )
    }

    const aircraft = await prisma.aircraft.findUnique({
      where: { id: aircraftId },
      include: {
        bookings: {
          include: {
            student: true,
            instructor: true,
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

    if (!aircraft) {
      return NextResponse.json(
        { error: 'Aircraft not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(aircraft)

  } catch (error) {
    console.error('Get aircraft error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// PATCH /api/aircraft/[id] - Update an aircraft
export const PATCH = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const aircraftId = parseInt(params.id)

    if (isNaN(aircraftId)) {
      return NextResponse.json(
        { error: 'Invalid aircraft ID' },
        { status: 400 }
      )
    }

    const body = await req.json()

    // Validate input
    const validation = updateAircraftSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    // Check if aircraft exists
    const existingAircraft = await prisma.aircraft.findUnique({
      where: { id: aircraftId }
    })

    if (!existingAircraft) {
      return NextResponse.json(
        { error: 'Aircraft not found' },
        { status: 404 }
      )
    }

    const validatedData = validation.data

    // Check if tail number is being changed and if it's already in use
    if (validatedData.tailNumber && validatedData.tailNumber !== existingAircraft.tailNumber) {
      const tailNumberExists = await prisma.aircraft.findUnique({
        where: { tailNumber: validatedData.tailNumber }
      })

      if (tailNumberExists) {
        return NextResponse.json(
          { error: 'Tail number already in use by another aircraft' },
          { status: 409 }
        )
      }
    }

    // Update aircraft
    const updatedAircraft = await prisma.aircraft.update({
      where: { id: aircraftId },
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

    return NextResponse.json(updatedAircraft)

  } catch (error) {
    console.error('Update aircraft error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// DELETE /api/aircraft/[id] - Delete an aircraft
export const DELETE = withAuth(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const aircraftId = parseInt(params.id)

    if (isNaN(aircraftId)) {
      return NextResponse.json(
        { error: 'Invalid aircraft ID' },
        { status: 400 }
      )
    }

    // Check if aircraft exists
    const existingAircraft = await prisma.aircraft.findUnique({
      where: { id: aircraftId },
      include: {
        bookings: {
          where: { status: { in: ['scheduled', 'confirmed'] } }
        }
      }
    })

    if (!existingAircraft) {
      return NextResponse.json(
        { error: 'Aircraft not found' },
        { status: 404 }
      )
    }

    // Check if aircraft has active bookings
    if (existingAircraft.bookings.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete aircraft with active bookings. Cancel or complete bookings first.' },
        { status: 409 }
      )
    }

    // Delete aircraft (cascade will handle related records)
    await prisma.aircraft.delete({
      where: { id: aircraftId }
    })

    return NextResponse.json({
      message: 'Aircraft deleted successfully'
    })

  } catch (error) {
    console.error('Delete aircraft error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})