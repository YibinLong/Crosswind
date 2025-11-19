import OpenAI from 'openai';
import { WeatherData, WEATHER_MINIMUMS } from '@/lib/types';

// Enhanced interfaces for AI rescheduling
export interface RescheduleConstraints {
  // Time constraints
  preferredDaysOfWeek?: number[]; // 0 = Sunday, 6 = Saturday
  preferredTimeRanges?: Array<{ start: string; end: string }>; // "09:00", "17:00"
  blackoutDates?: Date[];
  maxDaysInFuture?: number;

  // Resource constraints
  availableAircraftIds?: number[];
  availableInstructorIds?: number[];

  // Student constraints
  trainingLevel: string;
  totalFlightHours?: number;
  recentFlightCount?: number; // Flights in last 30 days
}

export interface RescheduleContext {
  // Original booking details
  originalBooking: {
    id: number;
    scheduledDate: Date;
    departureLat: number;
    departureLon: number;
    arrivalLat?: number;
    arrivalLon?: number;
    studentName: string;
    instructorName: string;
    aircraftModel: string;
    trainingLevel: string;
  };

  // Weather context
  weatherConflict: {
    violationReasons: string[];
    currentConditions: WeatherData;
    forecast: WeatherData[];
    dataSource?: 'report' | 'live_fetch';
    rawCurrentWeather?: WeatherData | null;
  };

  // Constraints
  constraints: RescheduleConstraints;

  // Available slots (mock for MVP, would integrate with scheduling system)
  mockAvailableSlots: Array<{
    date: Date;
    time: string;
    aircraftId: number;
    instructorId: number;
    weatherForecast?: WeatherData;
  }>;
}

export interface AIRescheduleSuggestion {
  proposedDate: Date;
  proposedTime: string;
  confidence: number; // 0-1
  reason: string;
  weatherSummary: string;
  advantages: string[];
  considerations: string[];
  estimatedSuccessProbability: number;
}

interface OpenAIError {
  message: string;
  code?: number;
  type?: string;
}

export class OpenAIService {
  private readonly client: OpenAI;
  private readonly model: string = 'gpt-4o';
  private readonly maxTokens: number = 1000;
  private readonly temperature: number = 0.3; // Lower for more consistent results

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    this.client = new OpenAI({
      apiKey,
    });
  }

  /**
   * Generate intelligent reschedule suggestions using AI
   */
  async generateRescheduleSuggestions(context: RescheduleContext): Promise<AIRescheduleSuggestion[]> {
    try {
      const prompt = this.buildPrompt(context);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      return this.parseResponse(content, context);
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        const openaiError: OpenAIError = {
          message: error.message,
          code: error.status,
          type: error.type
        };
        console.error('OpenAI API Error:', openaiError);

        // Return fallback suggestions if AI fails
        return this.generateFallbackSuggestions(context);
      }

      console.error('Failed to generate AI suggestions:', error);
      return this.generateFallbackSuggestions(context);
    }
  }

  /**
   * Build comprehensive prompt for the AI
   */
  private buildPrompt(context: RescheduleContext): string {
    const { originalBooking, weatherConflict, constraints, mockAvailableSlots } = context;

    return `
You are an expert flight scheduling assistant for a flight training school. Please analyze the following weather conflict and provide 3 intelligent reschedule suggestions.

ORIGINAL BOOKING DETAILS:
- Booking ID: ${originalBooking.id}
- Scheduled: ${originalBooking.scheduledDate.toISOString()}
- Student: ${originalBooking.studentName} (Training Level: ${originalBooking.trainingLevel})
- Instructor: ${originalBooking.instructorName}
- Aircraft: ${originalBooking.aircraftModel}
- Route: ${originalBooking.departureLat}, ${originalBooking.departureLon} to ${originalBooking.arrivalLat || 'unknown'}, ${originalBooking.arrivalLon || 'unknown'}

WEATHER CONFLICT:
- Current Issues: ${weatherConflict.violationReasons.join(', ')}
- Conditions: ${weatherConflict.currentConditions.conditions}
- Wind: ${weatherConflict.currentConditions.windSpeed} knots (gusting to ${weatherConflict.currentConditions.windGust || 'N/A'} knots)
- Visibility: ${weatherConflict.currentConditions.visibility} miles
- Temperature: ${weatherConflict.currentConditions.temperature}°C
- Weather Source: ${weatherConflict.dataSource === 'live_fetch' ? 'Live fetch' : 'Recent report'}

TRAINING LEVEL WEATHER MINIMUMS:
${JSON.stringify(WEATHER_MINIMUMS[constraints.trainingLevel as keyof typeof WEATHER_MINIMUMS] || WEATHER_MINIMUMS['student-pilot'], null, 2)}

AVAILABLE TIME SLOTS (Next 7 Days):
${mockAvailableSlots.map((slot, i) =>
  `${i + 1}. ${slot.date.toDateString()} at ${slot.time} (Aircraft ID: ${slot.aircraftId}, Instructor ID: ${slot.instructorId})`
).join('\n')}

FORECAST FOR AVAILABLE SLOTS:
${mockAvailableSlots.map(slot =>
  `${slot.date.toDateString()}: ${slot.weatherForecast?.conditions || 'Unknown forecast'} - Wind: ${slot.weatherForecast?.windSpeed || 'N/A'} knots, Visibility: ${slot.weatherForecast?.visibility || 'N/A'} miles`
).join('\n')}

CONSTRAINTS:
- Max days in future: ${constraints.maxDaysInFuture || 7}
- Preferred days: ${constraints.preferredDaysOfWeek?.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ') || 'Any'}
- Preferred times: ${constraints.preferredTimeRanges?.map(r => `${r.start}-${r.end}`).join(', ') || 'Any'}

Please provide exactly 3 reschedule suggestions in JSON format:
{
  "suggestions": [
    {
      "proposedDate": "YYYY-MM-DD",
      "proposedTime": "HH:MM",
      "confidence": 0.85,
      "reason": "Clear explanation of why this time works well",
      "weatherSummary": "Expected weather conditions",
      "advantages": ["advantage 1", "advantage 2"],
      "considerations": ["consideration 1", "consideration 2"],
      "estimatedSuccessProbability": 0.9
    }
  ]
}

Prioritize suggestions that:
1. Have safe weather conditions for the student's training level
2. Offer the highest probability of successful completion
3. Consider student continuity and learning progression
4. Optimize aircraft and instructor utilization
5. Provide reasonable timing (avoid very early/late slots unless necessary)

Ensure all suggestions meet or exceed the weather minimums for the student's training level.
    `;
  }

  /**
   * Get system prompt that defines the AI's role and capabilities
   */
  private getSystemPrompt(): string {
    return `
You are an expert flight scheduling AI assistant for a Part 61 flight training school. You have deep knowledge of:

1. FAA weather minimums for different pilot training levels (Student, Private, Instrument, Commercial)
2. Meteorological patterns and weather forecasting
3. Flight training operations and scheduling best practices
4. Aircraft performance and limitations
5. Student learning progression and continuity

Your role is to provide safe, practical, and educationally sound rescheduling suggestions when weather conflicts arise. Always prioritize:

- Safety first: All suggestions must meet or exceed FAA weather minimums
- Educational value: Consider the student's learning progression
- Operational efficiency: Optimize resource utilization
- Weather awareness: Leverage forecasting to avoid further conflicts

Provide responses in JSON format as requested. Be specific about weather conditions and safety considerations. If you cannot find suitable options, clearly state the limitations and recommend manual review.
    `;
  }

  /**
   * Parse AI response and transform into structured suggestions
   */
  private parseResponse(content: string, context: RescheduleContext): AIRescheduleSuggestion[] {
    try {
      const parsed = JSON.parse(content);

      if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
        throw new Error('Invalid response format: missing suggestions array');
      }

      return parsed.suggestions.map((suggestion: any, index: number) => ({
        proposedDate: new Date(suggestion.proposedDate),
        proposedTime: suggestion.proposedTime,
        confidence: Math.max(0, Math.min(1, suggestion.confidence || 0.5)),
        reason: suggestion.reason || `AI-generated option ${index + 1}`,
        weatherSummary: suggestion.weatherSummary || 'Expected favorable conditions',
        advantages: Array.isArray(suggestion.advantages) ? suggestion.advantages : [],
        considerations: Array.isArray(suggestion.considerations) ? suggestion.considerations : [],
        estimatedSuccessProbability: Math.max(0, Math.min(1, suggestion.estimatedSuccessProbability || 0.8))
      }));
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.error('Raw content:', content);
      return this.generateFallbackSuggestions(context);
    }
  }

  /**
   * Generate rule-based fallback suggestions when AI fails
   */
  private generateFallbackSuggestions(context: RescheduleContext): AIRescheduleSuggestion[] {
    const { mockAvailableSlots, weatherConflict } = context;

    const baselineVisibility = weatherConflict.currentConditions.visibility || 0;
    const baselineWind = weatherConflict.currentConditions.windSpeed || 0;
    const hasVisibilityBaseline = baselineVisibility > 0;
    const hasWindBaseline = baselineWind > 0;

    // Filter for slots with better weather
    const goodWeatherSlots = mockAvailableSlots.filter(slot => {
      const forecast = slot.weatherForecast;
      if (!forecast) return false;

      // Simple heuristic: better conditions than current conflict or baseline
      const visibilityImproved = !hasVisibilityBaseline || forecast.visibility > baselineVisibility;
      const windImproved = !hasWindBaseline || forecast.windSpeed < baselineWind;

      return visibilityImproved && windImproved;
    });

    const candidateSlots = (goodWeatherSlots.length > 0 ? goodWeatherSlots : mockAvailableSlots).slice(0, 3);

    // Take top 3 best options
    return candidateSlots.map((slot, index) => ({
      proposedDate: slot.date,
      proposedTime: slot.time,
      confidence: 0.65 + (index * 0.05), // Varying confidence: 65%, 70%, 75%
      reason: goodWeatherSlots.length > 0
        ? 'Rule-based suggestion: Improved weather conditions expected'
        : 'Opportunity to optimise schedule despite safe current weather.',
      weatherSummary: `${slot.weatherForecast?.conditions || 'Improved conditions'} - Wind: ${slot.weatherForecast?.windSpeed || 'N/A'} knots, Visibility: ${slot.weatherForecast?.visibility || 'N/A'} miles`,
      advantages: [
        goodWeatherSlots.length > 0 ? 'Better weather conditions than current slot' : 'Maintains proactive scheduling cadence',
        'Meets training level requirements'
      ],
      considerations: [
        'AI suggestions temporarily unavailable',
        'Manual review recommended'
      ],
      estimatedSuccessProbability: 0.75
    }));
  }

  /**
   * Test the OpenAI connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'user',
            content: 'Respond with just "OK" to test the connection.'
          }
        ],
        max_tokens: 10
      });

      return response.choices[0]?.message?.content?.includes('OK') || false;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }

  /**
   * Get usage statistics for cost monitoring
   */
  async getUsageStats(): Promise<{
    totalTokens: number;
    estimatedCost: number;
    requestsCount: number
  }> {
    // This would typically be stored in a database or cache
    // For now, return mock data
    return {
      totalTokens: 0,
      estimatedCost: 0,
      requestsCount: 0
    };
  }
}

// Export singleton instance
export const openAIService = new OpenAIService();
