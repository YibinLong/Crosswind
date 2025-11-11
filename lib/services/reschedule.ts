import { prisma } from '@/lib/prisma';
import { weatherService } from './weather';
import { openAIService, AIRescheduleSuggestion, RescheduleContext, RescheduleConstraints } from './openai';
import { WeatherData, WEATHER_MINIMUMS } from '@/lib/types';

// Enhanced interfaces for database operations
export interface RescheduleRequest {
  bookingId: number;
  constraints?: Partial<RescheduleConstraints>;
  requestedBy?: string; // User email or ID
}

export interface RescheduleResult {
  success: boolean;
  suggestions?: AIRescheduleSuggestion[];
  error?: string;
  bookingId: number;
}

export interface ConfirmRescheduleRequest {
  suggestionId: number;
  bookingId: number;
  confirmedBy: string; // User email or ID
  notes?: string;
}

export interface ConfirmRescheduleResult {
  success: boolean;
  updatedBooking?: any;
  error?: string;
}

export class RescheduleService {
  /**
   * Generate AI-powered reschedule suggestions for a conflicted booking
   */
  async generateSuggestions(request: RescheduleRequest): Promise<RescheduleResult> {
    try {
      // Fetch the booking with all related data
      const booking = await this.fetchBookingWithDetails(request.bookingId);
      if (!booking) {
        return {
          success: false,
          error: 'Booking not found',
          bookingId: request.bookingId
        };
      }

      // REMOVED: Allow AI-powered rescheduling for ALL flight statuses, not just conflicts
      // This enables proactive rescheduling and optimization for any booking

      // Build context for AI
      const context = await this.buildRescheduleContext(booking, request.constraints);

      // Generate AI suggestions
      const suggestions = await openAIService.generateRescheduleSuggestions(context);

      // Save suggestions to database and get the saved suggestions with IDs
      const savedSuggestions = await this.saveSuggestionsToDatabase(request.bookingId, suggestions);

      return {
        success: true,
        suggestions: savedSuggestions, // Return saved suggestions with database IDs
        bookingId: request.bookingId
      };
    } catch (error) {
      console.error('Failed to generate reschedule suggestions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        bookingId: request.bookingId
      };
    }
  }

  /**
   * Confirm and execute a reschedule suggestion
   */
  async confirmSuggestion(request: ConfirmRescheduleRequest): Promise<ConfirmRescheduleResult> {
    try {
      // Start transaction
      const result = await prisma.$transaction(async (tx) => {
        // Fetch the suggestion
        const suggestion = await tx.rescheduleSuggestion.findUnique({
          where: { id: request.suggestionId },
          include: { booking: true }
        });

        if (!suggestion) {
          throw new Error('Reschedule suggestion not found');
        }

        if (suggestion.bookingId !== request.bookingId) {
          throw new Error('Suggestion does not match the specified booking');
        }

        if (suggestion.selected) {
          throw new Error('This suggestion has already been used');
        }

        // Validate the new date/time doesn't have conflicts
        const newDateTime = this.combineDateAndTime(suggestion.proposedDate, suggestion.proposedTime);
        await this.validateNewSchedule(tx, request.bookingId, newDateTime, suggestion.booking.aircraftId);

        // Update the booking
        const updatedBooking = await tx.booking.update({
          where: { id: request.bookingId },
          data: {
            scheduledDate: newDateTime,
            status: 'confirmed' // Reset to confirmed when rescheduled
          },
          include: {
            student: true,
            instructor: true,
            aircraft: true
          }
        });

        // Mark the suggestion as selected
        await tx.rescheduleSuggestion.update({
          where: { id: request.suggestionId },
          data: { selected: true }
        });

        // Create audit log entry
        await tx.auditLog.create({
          data: {
            bookingId: request.bookingId,
            action: 'RESCHEDULE_CONFIRMED',
            performedBy: request.confirmedBy,
            details: `Rescheduled to ${suggestion.proposedDate.toDateString()} at ${suggestion.proposedTime}. Reason: ${suggestion.reason}. Weather: ${suggestion.weatherSummary}`
          }
        });

        // Archive other suggestions for this booking
        await tx.rescheduleSuggestion.updateMany({
          where: {
            bookingId: request.bookingId,
            id: { not: request.suggestionId },
            selected: false
          },
          data: { selected: true } // Mark as "processed" to avoid confusion
        });

        return updatedBooking;
      });

      return {
        success: true,
        updatedBooking: result
      };
    } catch (error) {
      console.error('Failed to confirm reschedule suggestion:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Fetch booking with all necessary related data
   */
  private async fetchBookingWithDetails(bookingId: number) {
    return await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        student: true,
        instructor: true,
        aircraft: true,
        weatherReports: {
          orderBy: { createdAt: 'desc' },
          take: 5 // Get recent weather reports
        },
        rescheduleSuggestions: {
          where: { selected: false },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  /**
   * Build comprehensive context for AI rescheduling
   */
  private async buildRescheduleContext(booking: any, constraints?: Partial<RescheduleConstraints>): Promise<RescheduleContext> {
    // Get weather data for the conflict
    const weatherReports = booking.weatherReports || [];
    const currentWeather = weatherReports[0];

    // Fetch 7-day forecast for departure and arrival locations
    const forecastData = await this.fetchSevenDayForecast(
      booking.departureLat,
      booking.departureLon,
      booking.arrivalLat,
      booking.arrivalLon
    );

    // Generate mock available slots (would integrate with real scheduling system)
    const mockAvailableSlots = this.generateMockAvailableSlots(booking, forecastData);

    // Determine weather conflict reasons
    const violationReasons = currentWeather?.violatedMinimums || ['Weather conditions below minimums'];

    return {
      originalBooking: {
        id: booking.id,
        scheduledDate: booking.scheduledDate,
        departureLat: booking.departureLat,
        departureLon: booking.departureLon,
        arrivalLat: booking.arrivalLat,
        arrivalLon: booking.arrivalLon,
        studentName: booking.student.name,
        instructorName: booking.instructor.name,
        aircraftModel: booking.aircraft.model,
        trainingLevel: booking.student.trainingLevel
      },
      weatherConflict: {
        violationReasons,
        currentConditions: this.parseWeatherReport(currentWeather),
        forecast: forecastData
      },
      constraints: {
        trainingLevel: booking.student.trainingLevel,
        maxDaysInFuture: 7,
        preferredDaysOfWeek: [1, 2, 3, 4, 5], // Weekdays preferred
        preferredTimeRanges: [
          { start: '08:00', end: '12:00' },
          { start: '14:00', end: '18:00' }
        ],
        availableAircraftIds: [booking.aircraftId], // Same aircraft for simplicity
        availableInstructorIds: [booking.instructorId], // Same instructor for simplicity
        ...constraints
      },
      mockAvailableSlots
    };
  }

  /**
   * Fetch 7-day weather forecast for both departure and arrival locations
   */
  private async fetchSevenDayForecast(departLat: number, departLon: number, arriveLat?: number, arriveLon?: number): Promise<WeatherData[]> {
    // For MVP, we'll generate mock forecast data
    // In production, this would call a weather API with forecast support
    const forecast: WeatherData[] = [];

    for (let i = 1; i <= 7; i++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i);

      // Mock improving weather conditions over time
      const baseVisibility = 3 + (i * 0.5); // Improving visibility
      const baseWindSpeed = Math.max(5, 15 - (i * 1)); // Decreasing wind

      forecast.push({
        location: `${departLat}, ${departLon}`,
        timestamp: futureDate.toISOString(),
        visibility: Math.min(baseVisibility, 10),
        windSpeed: Math.max(baseWindSpeed, 3),
        windGust: baseWindSpeed > 8 ? baseWindSpeed + 3 : undefined,
        temperature: 20 + Math.random() * 10,
        conditions: this.getRealisticWeatherCondition(i),
        isSafe: true,
        violatedMinimums: []
      });
    }

    return forecast;
  }

  /**
   * Generate realistic weather conditions that improve over time
   */
  private getRealisticWeatherCondition(daysInFuture: number): string {
    const conditions = [
      'Partly cloudy', ' Mostly sunny', 'Clear', 'Few clouds',
      'Scattered clouds', 'Overcast clearing', 'VFR conditions'
    ];

    // Better conditions for future dates
    const goodConditions = ['Clear', 'VFR conditions', 'Mostly sunny'];
    if (daysInFuture >= 3) {
      return goodConditions[Math.floor(Math.random() * goodConditions.length)];
    }

    return conditions[Math.floor(Math.random() * conditions.length)];
  }

  /**
   * Generate mock available time slots (would integrate with real scheduling system)
   */
  private generateMockAvailableSlots(booking: any, forecastData: WeatherData[]) {
    const slots = [];
    const currentDate = new Date();

    // Generate slots for the next 7 days
    for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
      const slotDate = new Date(currentDate);
      slotDate.setDate(currentDate.getDate() + dayOffset);

      // Skip weekends for now
      const dayOfWeek = slotDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip Sunday & Saturday

      // Generate 2-3 time slots per day
      const timeSlots = ['09:00', '11:00', '14:00', '16:00'];
      const slotsPerDay = Math.min(3, timeSlots.length);

      for (let i = 0; i < slotsPerDay; i++) {
        slots.push({
          date: new Date(slotDate),
          time: timeSlots[i],
          aircraftId: booking.aircraftId,
          instructorId: booking.instructorId,
          weatherForecast: forecastData[dayOffset - 1]
        });
      }
    }

    return slots;
  }

  /**
   * Parse weather report from database into WeatherData format
   */
  private parseWeatherReport(weatherReport: any): WeatherData {
    return {
      location: `${weatherReport?.location || 'Unknown'}`,
      timestamp: weatherReport?.createdAt?.toISOString() || new Date().toISOString(),
      visibility: weatherReport?.visibility || 0,
      windSpeed: weatherReport?.windKts || 0,
      windGust: weatherReport?.windGustKts,
      temperature: weatherReport?.temperature || 0,
      conditions: weatherReport?.condition || 'Unknown',
      isSafe: weatherReport?.isSafe || false,
      violatedMinimums: weatherReport?.violatedMinimums || []
    };
  }

  /**
   * Save AI-generated suggestions to database
   */
  private async saveSuggestionsToDatabase(bookingId: number, suggestions: AIRescheduleSuggestion[]) {
    const savedSuggestions = await Promise.all(
      suggestions.map((suggestion, index) =>
        prisma.rescheduleSuggestion.create({
          data: {
            bookingId,
            proposedDate: suggestion.proposedDate,
            proposedTime: suggestion.proposedTime,
            weatherSummary: suggestion.weatherSummary,
            confidence: suggestion.confidence,
            reason: suggestion.reason,
            selected: false
          }
        })
      )
    );

    // Merge AI suggestion data with database results to preserve all fields
    const mergedSuggestions = savedSuggestions.map((savedSuggestion, index) => ({
      ...savedSuggestion, // Database record with id, createdAt, updatedAt
      ...suggestions[index], // Original AI suggestion data (advantages, considerations, etc.)
      // Ensure critical fields aren't overridden
      id: savedSuggestion.id,
      proposedDate: savedSuggestion.proposedDate,
      proposedTime: savedSuggestion.proposedTime,
      confidence: savedSuggestion.confidence,
      reason: savedSuggestion.reason,
      weatherSummary: savedSuggestion.weatherSummary,
      selected: savedSuggestion.selected
    }));

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        bookingId,
        action: 'RESCHEDULE_SUGGESTIONS_GENERATED',
        performedBy: 'AI System',
        details: `Generated ${savedSuggestions.length} AI-powered reschedule suggestions with average confidence: ${(suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length).toFixed(2)}`
      }
    });

    return mergedSuggestions;
  }

  /**
   * Combine date and time into a single Date object
   */
  private combineDateAndTime(date: Date, time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
  }

  /**
   * Validate that the new schedule doesn't have conflicts
   */
  private async validateNewSchedule(tx: any, bookingId: number, newDateTime: Date, aircraftId: number) {
    // Check for conflicting bookings with the same aircraft
    const conflictingBookings = await tx.booking.findMany({
      where: {
        id: { not: bookingId },
        aircraftId,
        scheduledDate: {
          gte: new Date(newDateTime.getTime() - 2 * 60 * 60 * 1000), // 2 hours before
          lte: new Date(newDateTime.getTime() + 2 * 60 * 60 * 1000)  // 2 hours after
        },
        status: { in: ['scheduled', 'confirmed'] }
      }
    });

    if (conflictingBookings.length > 0) {
      throw new Error('Aircraft is already booked for this time slot');
    }

    // Additional validation could include:
    // - Instructor availability
    // - Student schedule conflicts
    // - Maintenance schedules
    // - Airport operating hours
  }

  /**
   * Get existing suggestions for a booking
   */
  async getExistingSuggestions(bookingId: number) {
    return await prisma.rescheduleSuggestion.findMany({
      where: {
        bookingId,
        selected: false
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Limit to most recent 10 suggestions
    });
  }

  /**
   * Cancel/delete suggestions for a booking
   */
  async cancelSuggestions(bookingId: number, performedBy: string) {
    await prisma.rescheduleSuggestion.updateMany({
      where: {
        bookingId,
        selected: false
      },
      data: { selected: true } // Mark as processed to hide from UI
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        bookingId,
        action: 'RESCHEDULE_SUGGESTIONS_CANCELLED',
        performedBy,
        details: 'Cancelled pending reschedule suggestions'
      }
    });
  }
}

// Export singleton instance
export const rescheduleService = new RescheduleService();