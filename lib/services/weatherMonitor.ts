import { PrismaClient } from '@prisma/client';
import { weatherService } from './weather';
import { WeatherMinimumsService } from './weatherMinimums';
import { notificationService } from './notification';
import { generateWeatherConflictEmail } from '../email-templates';
import { logger } from '../logger';

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

          const conflictSources: string[] = [];
          let aggregatedViolations: string[] = [];
          const corridorSummaries: Array<{
            label: string;
            weather: any;
            isSafe: boolean;
            violatedMinimums: string[];
          }> = [];

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
          if (!safetyEvaluation.isSafe) {
            conflictSources.push('departure');
          }
          aggregatedViolations = aggregatedViolations.concat(safetyEvaluation.violatedMinimums);

          // Create weather report
          const departureWeatherReport = await this.prisma.weatherReport.create({
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
          let arrivalWeatherData: any = null;
          if (booking.arrivalLat && booking.arrivalLon) {
            const arrivalWeather = await weatherService.fetchWeatherByCoordinates(
              booking.arrivalLat,
              booking.arrivalLon
            );
            arrivalWeatherData = arrivalWeather;

            arrivalSafety = WeatherMinimumsService.evaluateWeatherSafety(
              arrivalWeather,
              booking.student.trainingLevel
            );
            if (!arrivalSafety.isSafe) {
              conflictSources.push('arrival');
            }
            aggregatedViolations = aggregatedViolations.concat(arrivalSafety.violatedMinimums);

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
          let isOverallSafe = safetyEvaluation.isSafe &&
            (!arrivalSafety || arrivalSafety.isSafe);

          // Corridor checks between departure and arrival
          const corridorWaypoints = this.generateCorridorWaypoints(
            booking.departureLat,
            booking.departureLon,
            booking.arrivalLat,
            booking.arrivalLon
          );

          if (corridorWaypoints.length > 0) {
            for (const waypoint of corridorWaypoints) {
              const waypointWeather = await weatherService.fetchWeatherByCoordinates(
                waypoint.lat,
                waypoint.lon
              );
              const corridorSafety = WeatherMinimumsService.evaluateWeatherSafety(
                waypointWeather,
                booking.student.trainingLevel
              );

              await this.prisma.weatherReport.create({
                data: {
                  bookingId: booking.id,
                  location: waypoint.label,
                  windKts: waypointWeather.windSpeed,
                  windGustKts: waypointWeather.windGust,
                  visibility: waypointWeather.visibility,
                  ceilingFt: corridorSafety.evaluatedMinimums.ceiling.actual,
                  condition: waypointWeather.conditions,
                  temperature: waypointWeather.temperature,
                  isSafe: corridorSafety.isSafe,
                  violatedMinimums: corridorSafety.violatedMinimums
                }
              });

              corridorSummaries.push({
                label: waypoint.label,
                weather: waypointWeather,
                isSafe: corridorSafety.isSafe,
                violatedMinimums: corridorSafety.violatedMinimums
              });

              if (!corridorSafety.isSafe) {
                conflictSources.push(waypoint.label);
                isOverallSafe = false;
              }

              aggregatedViolations = aggregatedViolations.concat(
                corridorSafety.violatedMinimums.map(minimum => `${waypoint.label}: ${minimum}`)
              );

              await this.delay(750);
            }
          }

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
                details: `Automated monitoring detected weather conflict. Violated minimums: ${aggregatedViolations.join('; ')}`
              }
            });

            // Send email notifications for the new conflict
            await this.sendWeatherConflictNotifications(booking, departureWeatherReport, arrivalSafety, aggregatedViolations);
          }

          const detailWeather = {
            departure: departureWeather,
            arrival: arrivalWeatherData,
            corridor: corridorSummaries
          };

          result.details.push({
            bookingId: booking.id,
            studentName: booking.student.name,
            location: conflictSources.length > 0 ? conflictSources.join(', ') : 'all-clear',
            status: isOverallSafe ? 'safe' : 'conflict',
            weatherData: detailWeather,
            violatedMinimums: aggregatedViolations
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
   * Send weather conflict notifications to student and instructor
   */
  private async sendWeatherConflictNotifications(
    booking: any,
    departureWeatherReport: any,
    arrivalSafety: any,
    violatedMinimums: string[]
  ): Promise<void> {
    try {
      logger.info('Sending weather conflict notifications', {
        bookingId: booking.id,
        studentId: booking.studentId,
        instructorId: booking.instructorId,
      });

      // Prepare recipients
      const recipients = [
        {
          email: booking.student.email,
          name: booking.student.name,
        }
      ];

      // Add instructor if exists
      if (booking.instructor) {
        recipients.push({
          email: booking.instructor.email,
          name: booking.instructor.name,
        });
      }

      // Generate email content
      const emailTemplate = generateWeatherConflictEmail({
        student: booking.student,
        booking: booking,
        weatherReport: departureWeatherReport,
        instructorName: booking.instructor?.name,
        trainingLevelMinimums: violatedMinimums,
      });

      // Send notification
      const notificationResult = await notificationService.sendNotification({
        type: 'weather_conflict',
        recipients,
        subject: emailTemplate.subject,
        htmlContent: emailTemplate.htmlContent,
        textContent: emailTemplate.textContent,
        data: {
          bookingId: booking.id,
          weatherReportId: departureWeatherReport.id,
          violatedMinimums,
        },
      });

      if (notificationResult.success) {
        logger.info('Weather conflict notifications sent successfully', {
          bookingId: booking.id,
          recipientCount: recipients.length,
          messageId: notificationResult.messageId,
        });

        // Log notification in audit trail
        await this.prisma.auditLog.create({
          data: {
            bookingId: booking.id,
            action: 'weather_conflict_notification_sent',
            performedBy: 'system',
            details: `Weather conflict notifications sent to ${recipients.map(r => r.email).join(', ')}. Message ID: ${notificationResult.messageId}`,
          },
        });
      } else {
        logger.error('Failed to send weather conflict notifications', {
          bookingId: booking.id,
          error: notificationResult.error,
        });

        // Log failed notification in audit trail
        await this.prisma.auditLog.create({
          data: {
            bookingId: booking.id,
            action: 'weather_conflict_notification_failed',
            performedBy: 'system',
            details: `Failed to send weather conflict notifications. Error: ${notificationResult.error}`,
          },
        });
      }
    } catch (error) {
      logger.error('Error sending weather conflict notifications', {
        bookingId: booking.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private generateCorridorWaypoints(
    departureLat: number,
    departureLon: number,
    arrivalLat?: number | null,
    arrivalLon?: number | null,
    segments: number = 3
  ): Array<{ lat: number; lon: number; label: string }> {
    if (typeof arrivalLat !== 'number' || typeof arrivalLon !== 'number') {
      return [];
    }

    const waypoints: Array<{ lat: number; lon: number; label: string }> = [];
    for (let i = 1; i <= segments; i++) {
      const fraction = i / (segments + 1);
      waypoints.push({
        lat: departureLat + (arrivalLat - departureLat) * fraction,
        lon: departureLon + (arrivalLon - departureLon) * fraction,
        label: `corridor-${i}`
      });
    }
    return waypoints;
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
