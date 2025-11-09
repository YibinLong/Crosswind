import { WeatherData, WEATHER_MINIMUMS } from '@/lib/types';

export interface WeatherSafetyResult {
  isSafe: boolean;
  violatedMinimums: string[];
  evaluatedMinimums: {
    visibility: { required: number; actual: number; isSafe: boolean };
    ceiling: { required: number; actual: number; isSafe: boolean };
    windSpeed: { required: number; actual: number; isSafe: boolean };
    crosswind: { required: number; actual?: number; isSafe: boolean };
  };
  trainingLevel: string;
  recommendations: string[];
}

/**
 * Evaluate weather safety based on pilot training level and weather minimums
 */
export class WeatherMinimumsService {
  /**
   * Evaluate if weather conditions are safe for a given training level
   */
  static evaluateWeatherSafety(
    weatherData: WeatherData,
    trainingLevel: string
  ): WeatherSafetyResult {
    // Map training levels to our minimums keys
    const trainingLevelMap: Record<string, keyof typeof WEATHER_MINIMUMS> = {
      'student': 'student-pilot',
      'student-pilot': 'student-pilot',
      'private': 'private-pilot',
      'private-pilot': 'private-pilot',
      'instrument': 'instrument-rated',
      'instrument-rated': 'instrument-rated',
      'commercial': 'instrument-rated', // Commercial pilots use instrument minimums
      'instructor': 'instrument-rated'   // Instructors use instrument minimums
    };

    const mappedLevel = trainingLevelMap[trainingLevel.toLowerCase()];
    if (!mappedLevel) {
      throw new Error(`Unknown training level: ${trainingLevel}`);
    }

    const minimums = WEATHER_MINIMUMS[mappedLevel];
    const violatedMinimums: string[] = [];
    const recommendations: string[] = [];

    // Get the actual values from weather data
    const actualVisibility = weatherData.visibility || 0;
    const actualWindSpeed = weatherData.windSpeed || 0;
    const actualCeiling = this.extractCeilingFromWeather(weatherData);
    const actualCrosswind = this.calculateCrosswind(weatherData);

    // Evaluate visibility
    const visibilitySafe = actualVisibility >= minimums.visibility;
    if (!visibilitySafe) {
      violatedMinimums.push(
        `Visibility: ${actualVisibility} miles (required: ${minimums.visibility}+ miles)`
      );
      recommendations.push(`Wait for visibility to improve to ${minimums.visibility}+ miles`);
    }

    // Evaluate ceiling (only relevant for VFR operations)
    const ceilingSafe = actualCeiling >= minimums.ceiling;
    if (!ceilingSafe && minimums.ceiling > 0) {
      violatedMinimums.push(
        `Ceiling: ${actualCeiling} ft (required: ${minimums.ceiling}+ ft)`
      );
      recommendations.push(`Wait for ceiling to rise to ${minimums.ceiling}+ ft`);
    }

    // Evaluate wind speed
    const windSpeedSafe = actualWindSpeed <= minimums.windSpeed;
    if (!windSpeedSafe) {
      violatedMinimums.push(
        `Wind Speed: ${actualWindSpeed.toFixed(1)} kts (max: ${minimums.windSpeed} kts)`
      );
      recommendations.push(`Wait for wind to decrease to ${minimums.windSpeed} kts or less`);
    }

    // Evaluate crosswind (if we have wind direction data)
    const crosswindSafe = actualCrosswind <= minimums.crosswind;
    if (!crosswindSafe && actualCrosswind !== undefined) {
      violatedMinimums.push(
        `Crosswind: ${actualCrosswind.toFixed(1)} kts (max: ${minimums.crosswind} kts)`
      );
      recommendations.push(`Consider runway change or wait for crosswind to decrease`);
    }

    // Generate general recommendations based on conditions
    if (weatherData.conditions && weatherData.conditions.toLowerCase().includes('rain')) {
      recommendations.push('Be cautious of reduced visibility in rain');
    }

    if (weatherData.conditions && weatherData.conditions.toLowerCase().includes('snow')) {
      recommendations.push('Check runway conditions for snow/ice contamination');
    }

    if (weatherData.conditions && weatherData.conditions.toLowerCase().includes('fog')) {
      recommendations.push('Fog conditions may change rapidly - monitor closely');
    }

    if (actualWindSpeed > 15) {
      recommendations.push('Strong winds may affect aircraft handling');
    }

    const isSafe = violatedMinimums.length === 0;

    return {
      isSafe,
      violatedMinimums,
      evaluatedMinimums: {
        visibility: {
          required: minimums.visibility,
          actual: actualVisibility,
          isSafe: visibilitySafe
        },
        ceiling: {
          required: minimums.ceiling,
          actual: actualCeiling,
          isSafe: ceilingSafe
        },
        windSpeed: {
          required: minimums.windSpeed,
          actual: actualWindSpeed,
          isSafe: windSpeedSafe
        },
        crosswind: {
          required: minimums.crosswind,
          actual: actualCrosswind,
          isSafe: crosswindSafe
        }
      },
      trainingLevel,
      recommendations
    };
  }

  /**
   * Extract ceiling height from weather data
   * This is a simplified approach - in real implementation you'd parse METAR/SKY conditions
   */
  private static extractCeilingFromWeather(weatherData: WeatherData): number {
    // If weather data includes cloud cover information
    const weatherWithExtra = weatherData as any;

    if (weatherWithExtra.cloudCover !== undefined) {
      // Simplified conversion from cloud cover percentage to ceiling estimate
      // This is a rough approximation - real aviation uses cloud layers
      if (weatherWithExtra.cloudCover < 25) {
        return 10000; // Clear skies - high ceiling
      } else if (weatherWithExtra.cloudCover < 50) {
        return 5000; // Partly cloudy
      } else if (weatherWithExtra.cloudCover < 75) {
        return 2500; // Mostly cloudy
      } else {
        return 1000; // Overcast - low ceiling
      }
    }

    // If no cloud data, assume VFR conditions (conservative approach)
    return 5000;
  }

  /**
   * Calculate crosswind component from wind data
   * This is simplified - in reality you'd need runway orientation
   */
  private static calculateCrosswind(weatherData: WeatherData): number | undefined {
    const weatherWithExtra = weatherData as any;

    if (weatherWithExtra.windDirection === undefined || weatherData.windSpeed === undefined) {
      return undefined;
    }

    // Simplified calculation assuming worst-case scenario (90-degree crosswind)
    // In reality, you'd need runway heading to calculate actual crosswind component
    const windSpeed = weatherData.windSpeed;

    // Assume a 45-degree crosswind component as a reasonable estimate
    // crosswind = wind_speed × sin(wind_angle)
    const crosswindComponent = windSpeed * Math.sin(45 * Math.PI / 180);

    return Math.round(crosswindComponent * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Get human-readable assessment of weather conditions
   */
  static getWeatherAssessment(result: WeatherSafetyResult): string {
    if (result.isSafe) {
      return 'Weather conditions are suitable for flight operations.';
    }

    const criticalIssues = result.violatedMinimums.filter(violation =>
      violation.includes('Visibility') || violation.includes('Ceiling')
    );

    if (criticalIssues.length > 0) {
      return 'Weather conditions are NOT suitable for VFR flight operations due to visibility or ceiling restrictions.';
    }

    return 'Weather conditions are marginal due to wind limitations. Use caution or consider alternative timing.';
  }

  /**
   * Check if weather is improving or deteriorating based on trends
   * This would require historical data - simplified for now
   */
  static getWeatherTrend(current: WeatherData, previous?: WeatherData): 'improving' | 'deteriorating' | 'stable' {
    if (!previous) {
      return 'stable';
    }

    let trendPoints = 0;

    // Check visibility trend
    if (current.visibility > previous.visibility) {
      trendPoints++;
    } else if (current.visibility < previous.visibility) {
      trendPoints--;
    }

    // Check wind trend
    if (current.windSpeed < previous.windSpeed) {
      trendPoints++;
    } else if (current.windSpeed > previous.windSpeed) {
      trendPoints--;
    }

    if (trendPoints > 0) {
      return 'improving';
    } else if (trendPoints < 0) {
      return 'deteriorating';
    }

    return 'stable';
  }
}