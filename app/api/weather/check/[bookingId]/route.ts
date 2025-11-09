import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { WEATHER_MINIMUMS } from '@/lib/types';
import { weatherService } from '@/lib/services/weather';
import { WeatherMinimumsService } from '@/lib/services/weatherMinimums';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId: bookingIdParam } = await params;
    const bookingId = parseInt(bookingIdParam);

    if (isNaN(bookingId)) {
      return NextResponse.json(
        { error: 'Invalid booking ID' },
        { status: 400 }
      );
    }

    // Fetch booking with student and related data
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        student: true,
        instructor: true,
        aircraft: true
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if booking has required coordinates
    if (!booking.departureLat || !booking.departureLon) {
      return NextResponse.json(
        { error: 'Booking missing departure coordinates' },
        { status: 400 }
      );
    }

    // Prepare locations to check (departure and arrival if available)
    const locationsToCheck = [
      {
        lat: booking.departureLat,
        lon: booking.departureLon,
        name: 'Departure'
      }
    ];

    if (booking.arrivalLat && booking.arrivalLon) {
      locationsToCheck.push({
        lat: booking.arrivalLat,
        lon: booking.arrivalLon,
        name: 'Arrival'
      });
    }

    // Fetch weather for all locations
    const weatherResults = await weatherService.fetchMultipleLocationsWeather(locationsToCheck);

    // Evaluate weather safety for each location
    const safetyResults = [];
    let hasUnsafeConditions = false;
    let violatedMinimums: string[] = [];

    for (const result of weatherResults) {
      if (!result.weather) {
        safetyResults.push({
          location: result.location,
          error: 'Failed to fetch weather data',
          isSafe: false,
          assessment: 'Weather check failed - unable to retrieve data'
        });
        hasUnsafeConditions = true;
        continue;
      }

      // Evaluate weather safety based on student's training level
      const safetyEvaluation = WeatherMinimumsService.evaluateWeatherSafety(
        result.weather,
        booking.student.trainingLevel
      );

      safetyResults.push({
        location: result.location,
        weather: result.weather,
        safety: safetyEvaluation,
        assessment: WeatherMinimumsService.getWeatherAssessment(safetyEvaluation)
      });

      if (!safetyEvaluation.isSafe) {
        hasUnsafeConditions = true;
        violatedMinimums.push(...safetyEvaluation.violatedMinimums);
      }
    }

    // Create weather report records in database
    const weatherReports = [];
    for (const result of safetyResults) {
      if (result.weather) {
        try {
          const weatherReport = await prisma.weatherReport.create({
            data: {
              bookingId: booking.id,
              location: result.location,
              windKts: result.weather.windSpeed,
              windGustKts: result.weather.windGust,
              visibility: result.weather.visibility,
              ceilingFt: result.safety?.evaluatedMinimums.ceiling.actual,
              condition: result.weather.conditions,
              temperature: result.weather.temperature,
              isSafe: result.safety?.isSafe || false,
              violatedMinimums: result.safety?.violatedMinimums || []
            }
          });
          weatherReports.push(weatherReport);
        } catch (dbError) {
          console.error('Failed to create weather report:', dbError);
        }
      }
    }

    // Update booking status if there are unsafe conditions
    let updatedBooking = booking;
    if (hasUnsafeConditions && booking.status !== 'conflict') {
      updatedBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'conflict' }
      });

      // Create audit log entry
      try {
        await prisma.auditLog.create({
          data: {
            bookingId: booking.id,
            action: 'weather_conflict_detected',
            performedBy: 'system',
            details: `Weather conflict detected. Violated minimums: ${violatedMinimums.join('; ')}`
          }
        });
      } catch (logError) {
        console.error('Failed to create audit log:', logError);
      }
    }

    // Return comprehensive weather check results
    return NextResponse.json({
      success: true,
      booking: {
        id: updatedBooking.id,
        student: updatedBooking.student.name,
        trainingLevel: updatedBooking.student.trainingLevel,
        scheduledDate: updatedBooking.scheduledDate,
        departure: {
          lat: updatedBooking.departureLat,
          lon: updatedBooking.departureLon
        },
        arrival: updatedBooking.arrivalLat && updatedBooking.arrivalLon ? {
          lat: updatedBooking.arrivalLat,
          lon: updatedBooking.arrivalLon
        } : null,
        status: updatedBooking.status
      },
      weatherCheck: {
        timestamp: new Date().toISOString(),
        locationsChecked: locationsToCheck.length,
        hasConflict: hasUnsafeConditions,
        results: safetyResults,
        reportsCreated: weatherReports.length
      },
      overallAssessment: hasUnsafeConditions
        ? 'Weather conditions are not suitable for flight operations. Booking status updated to conflict.'
        : 'Weather conditions are suitable for flight operations.'
    });

  } catch (error) {
    console.error('Weather check error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error during weather check',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId: bookingIdParam } = await params;
    const bookingId = parseInt(bookingIdParam);

    if (isNaN(bookingId)) {
      return NextResponse.json(
        { error: 'Invalid booking ID' },
        { status: 400 }
      );
    }

    // Fetch existing weather reports for this booking
    const weatherReports = await prisma.weatherReport.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'desc' }
    });

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { student: true }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      booking: {
        id: booking.id,
        student: booking.student.name,
        trainingLevel: booking.student.trainingLevel,
        scheduledDate: booking.scheduledDate,
        status: booking.status
      },
      weatherReports: weatherReports.map(report => ({
        id: report.id,
        location: report.location,
        timestamp: report.createdAt,
        windKts: report.windKts,
        windGustKts: report.windGustKts,
        visibility: report.visibility,
        ceilingFt: report.ceilingFt,
        condition: report.condition,
        temperature: report.temperature,
        isSafe: report.isSafe,
        violatedMinimums: report.violatedMinimums
      }))
    });

  } catch (error) {
    console.error('Error fetching weather reports:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}