import { NextRequest, NextResponse } from 'next/server';
import { weatherMonitorService } from '@/lib/services/weatherMonitor';

export async function POST(request: NextRequest) {
  try {
    // Get request body for options
    const body = await request.json().catch(() => ({}));
    const { bookingId, dryRun = false } = body;

    let result;

    if (bookingId) {
      // Check specific booking
      console.log(`Starting weather monitoring for specific booking: ${bookingId}`);
      result = await weatherMonitorService.checkSingleBooking(parseInt(bookingId));

      return NextResponse.json({
        success: true,
        type: 'single_booking',
        bookingId,
        timestamp: new Date().toISOString(),
        result: {
          totalBookings: result.totalBookings,
          bookingsChecked: result.bookingsChecked,
          conflictsDetected: result.conflictsDetected,
          errors: result.errors,
          executionTime: result.executionTime,
          details: result.details
        }
      });
    } else {
      // Check all upcoming bookings
      console.log('Starting comprehensive weather monitoring for all upcoming bookings');

      if (dryRun) {
        // For dry run, just return what would be checked without making API calls
        return NextResponse.json({
          success: true,
          type: 'dry_run',
          timestamp: new Date().toISOString(),
          message: 'Dry run completed - no actual weather checks performed'
        });
      }

      result = await weatherMonitorService.checkAllUpcomingBookings();

      return NextResponse.json({
        success: true,
        type: 'comprehensive',
        timestamp: new Date().toISOString(),
        result: {
          totalBookings: result.totalBookings,
          bookingsChecked: result.bookingsChecked,
          conflictsDetected: result.conflictsDetected,
          errors: result.errors,
          executionTime: result.executionTime,
          details: result.details
        },
        summary: {
          conflictsRate: result.totalBookings > 0 ?
            ((result.conflictsDetected / result.totalBookings) * 100).toFixed(1) + '%' : '0%',
          errorRate: result.bookingsChecked > 0 ?
            ((result.errors.length / result.bookingsChecked) * 100).toFixed(1) + '%' : '0%',
          averageCheckTime: result.bookingsChecked > 0 ?
            Math.round(result.executionTime / result.bookingsChecked) + 'ms' : '0ms'
        }
      });
    }

  } catch (error) {
    console.error('Weather monitoring error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Weather monitoring failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return monitoring statistics
    const stats = await weatherMonitorService.getMonitoringStats();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        totalBookings: stats.totalBookings,
        upcomingBookings: stats.upcomingBookings,
        conflictsInLast24h: stats.conflictsInLast24h,
        conflictsInNext48h: stats.conflictsInNext48h,
        conflictRate: stats.upcomingBookings > 0 ?
          ((stats.conflictsInNext48h / stats.upcomingBookings) * 100).toFixed(1) + '%' : '0%'
      },
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching monitoring stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch monitoring statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}