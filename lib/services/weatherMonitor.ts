import { PrismaClient } from '@prisma/client';
import { weatherService } from './weather';
import { WeatherMinimumsService } from './weatherMinimums';

export interface MonitoringResult {
  totalBookings: number;
  bookingsChecked: number;
  conflictsDetected: number;
  errors: Array<{
    bookingId: number;
    error: string;
  }>;
  executionTime: number;
  details: Array<{
    bookingId: number;
    studentName: string;
    location: string;
    status: 'safe' | 'conflict' | 'error';
    weatherData?: any;
    violatedMinimums?: string[];
  }>;
}

export class WeatherMonitorService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Check all upcoming bookings (next 48 hours) for weather conflicts
   */
  async checkAllUpcomingBookings(): Promise<MonitoringResult> {
    const startTime = Date.now();
    const result: MonitoringResult = {
      totalBookings: 0,
      bookingsChecked: 0,
      conflictsDetected: 0,
      errors: [],
      executionTime: 0,
      details: []
    };

    try {
      // Get all bookings scheduled in the next 48 hours
      const now = new Date();
      const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      const upcomingBookings = await this.prisma.booking.findMany({
        where: {
          scheduledDate: {
            gte: now,
            lte: fortyEightHoursFromNow
          },
          status: {
            notIn: ['cancelled', 'completed'] // Skip cancelled or completed flights
          }
        },
        include: {
          student: true,
          instructor: true,
          aircraft: true,
          weatherReports: {
            orderBy: { createdAt: 'desc' },
            take: 1 // Get most recent weather report for each booking
          }
        }
      });

      result.totalBookings = upcomingBookings.length;

      console.log(`Found ${upcomingBookings.length} upcoming bookings to check`);

      // Process each booking
      for (const booking of upcomingBookings) {
        try {
          // Check if we already have a recent weather report (within last hour)
          const hasRecentReport = booking.weatherReports.length > 0 &&
            (Date.now() - booking.weatherReports[0].createdAt.getTime()) < (60 * 60 * 1000);

          if (hasRecentReport) {
            console.log(`Skipping booking ${booking.id} - recent weather report exists`);
            result.details.push({
              bookingId: booking.id,
              studentName: booking.student.name,
              location: 'departure',
              status: booking.weatherReports[0].isSafe ? 'safe' : 'conflict',
              violatedMinimums: booking.weatherReports[0].violatedMinimums
            });
            result.bookingsChecked++;
            if (!booking.weatherReports[0].isSafe) {
              result.conflictsDetected++;
            }
            continue;
          }

          // Fetch weather for departure location
          const departureWeather = await weatherService.fetchWeatherByCoordinates(
            booking.departureLat,
            booking.departureLon
          );

          // Evaluate weather safety
          const safetyEvaluation = WeatherMinimumsService.evaluateWeatherSafety(
            departureWeather,
            booking.student.trainingLevel
          );

          // Create weather report
          const weatherReport = await this.prisma.weatherReport.create({
            data: {
              bookingId: booking.id,
              location: 'departure',
              windKts: departureWeather.windSpeed,
              windGustKts: departureWeather.windGust,
              visibility: departureWeather.visibility,
              ceilingFt: safetyEvaluation.evaluatedMinimums.ceiling.actual,
              condition: departureWeather.conditions,
              temperature: departureWeather.temperature,
              isSafe: safetyEvaluation.isSafe,
              violatedMinimums: safetyEvaluation.violatedMinimums
            }
          });

          // If arrival coordinates exist, check arrival weather too
          let arrivalSafety = null;
          if (booking.arrivalLat && booking.arrivalLon) {
            const arrivalWeather = await weatherService.fetchWeatherByCoordinates(
              booking.arrivalLat,
              booking.arrivalLon
            );

            arrivalSafety = WeatherMinimumsService.evaluateWeatherSafety(
              arrivalWeather,
              booking.student.trainingLevel
            );

            await this.prisma.weatherReport.create({
              data: {
                bookingId: booking.id,
                location: 'arrival',
                windKts: arrivalWeather.windSpeed,
                windGustKts: arrivalWeather.windGust,
                visibility: arrivalWeather.visibility,
                ceilingFt: arrivalSafety.evaluatedMinimums.ceiling.actual,
                condition: arrivalWeather.conditions,
                temperature: arrivalWeather.temperature,
                isSafe: arrivalSafety.isSafe,
                violatedMinimums: arrivalSafety.violatedMinimums
              }
            });
          }

          // Determine overall safety (unsafe if either departure or arrival is unsafe)
          const isOverallSafe = safetyEvaluation.isSafe &&
            (!arrivalSafety || arrivalSafety.isSafe);

          // Update booking status if there's a conflict
          if (!isOverallSafe && booking.status !== 'conflict') {
            await this.prisma.booking.update({
              where: { id: booking.id },
              data: { status: 'conflict' }
            });

            // Create audit log
            await this.prisma.auditLog.create({
              data: {
                bookingId: booking.id,
                action: 'weather_conflict_detected',
                performedBy: 'system',
                details: `Automated monitoring detected weather conflict. Violated minimums: ${[
                  ...safetyEvaluation.violatedMinimums,
                  ...(arrivalSafety?.violatedMinimums || [])
                ].join('; ')}`
              }
            });
          }

          result.details.push({
            bookingId: booking.id,
            studentName: booking.student.name,
            location: 'departure',
            status: isOverallSafe ? 'safe' : 'conflict',
            weatherData: departureWeather,
            violatedMinimums: [
              ...safetyEvaluation.violatedMinimums,
              ...(arrivalSafety?.violatedMinimums || [])
            ]
          });

          result.bookingsChecked++;
          if (!isOverallSafe) {
            result.conflictsDetected++;
          }

          // Add delay to respect API rate limits
          await this.delay(1000); // 1 second delay between requests

        } catch (error) {
          console.error(`Error checking booking ${booking.id}:`, error);
          result.errors.push({
            bookingId: booking.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

    } catch (error) {
      console.error('Error in weather monitoring:', error);
      throw error;
    } finally {
      result.executionTime = Date.now() - startTime;
      await this.prisma.$disconnect();
    }

    return result;
  }

  /**
   * Check a specific booking for weather conflicts
   */
  async checkSingleBooking(bookingId: number): Promise<MonitoringResult> {
    const startTime = Date.now();
    const result: MonitoringResult = {
      totalBookings: 1,
      bookingsChecked: 0,
      conflictsDetected: 0,
      errors: [],
      executionTime: 0,
      details: []
    };

    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: { student: true }
      });

      if (!booking) {
        result.errors.push({
          bookingId,
          error: 'Booking not found'
        });
        result.executionTime = Date.now() - startTime;
        return result;
      }

      // Check if weather was already recently checked
      const recentReport = await this.prisma.weatherReport.findFirst({
        where: {
          bookingId,
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (recentReport) {
        result.details.push({
          bookingId,
          studentName: booking.student.name,
          location: recentReport.location,
          status: recentReport.isSafe ? 'safe' : 'conflict',
          violatedMinimums: recentReport.violatedMinimums
        });
        result.bookingsChecked = 1;
        if (!recentReport.isSafe) {
          result.conflictsDetected = 1;
        }
      } else {
        // Perform new weather check (reuse existing API logic)
        // This would ideally call the same logic as the weather check API
        console.log(`New weather check needed for booking ${bookingId}`);
      }

    } catch (error) {
      result.errors.push({
        bookingId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      result.executionTime = Date.now() - startTime;
      await this.prisma.$disconnect();
    }

    return result;
  }

  /**
   * Get monitoring statistics for the dashboard
   */
  async getMonitoringStats(): Promise<{
    totalBookings: number;
    upcomingBookings: number;
    conflictsInLast24h: number;
    conflictsInNext48h: number;
  }> {
    try {
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);

      const [
        totalBookings,
        upcomingBookings,
        conflictsInLast24h,
        conflictsInNext48h
      ] = await Promise.all([
        this.prisma.booking.count(),
        this.prisma.booking.count({
          where: {
            scheduledDate: {
              gte: now,
              lte: fortyEightHoursFromNow
            },
            status: { notIn: ['cancelled', 'completed'] }
          }
        }),
        this.prisma.weatherReport.count({
          where: {
            isSafe: false,
            createdAt: { gte: twentyFourHoursAgo }
          }
        }),
        this.prisma.booking.count({
          where: {
            scheduledDate: {
              gte: now,
              lte: fortyEightHoursFromNow
            },
            status: 'conflict'
          }
        })
      ]);

      return {
        totalBookings,
        upcomingBookings,
        conflictsInLast24h,
        conflictsInNext48h
      };

    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Helper function to add delay between API calls
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const weatherMonitorService = new WeatherMonitorService();