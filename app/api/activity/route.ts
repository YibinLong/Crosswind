import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/auth'
import { prisma } from '@/lib/prisma'

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const action = searchParams.get('action')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (action) {
      where.action = {
        contains: action,
        mode: 'insensitive'
      }
    }

    // Get audit logs with related data
    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        booking: {
          include: {
            student: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    // Get total count for pagination
    const totalCount = await prisma.auditLog.count({ where })

    // Format response
    const formattedLogs = auditLogs.map(log => ({
      id: log.id,
      bookingId: log.bookingId,
      action: log.action,
      performedBy: log.performedBy,
      details: log.details,
      createdAt: log.createdAt.toISOString(),
      booking: log.booking ? {
        id: log.booking.id,
        student: {
          name: log.booking.student?.name || 'Unknown Student'
        }
      } : null
    }))

    const response = {
      data: formattedLogs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Activity logs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    )
  }
})