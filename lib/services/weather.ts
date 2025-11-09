import axios from 'axios';
import { WeatherData } from '@/lib/types';

// WeatherAPI.com response interface
interface WeatherAPIResponse {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    tz_id: string;
    localtime_epoch: number;
    localtime: string;
  };
  current: {
    last_updated_epoch: number;
    last_updated: string;
    temp_c: number;
    temp_f: number;
    is_day: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    wind_mph: number;
    wind_kph: number;
    wind_degree: number;
    wind_dir: string;
    pressure_mb: number;
    pressure_in: number;
    precip_mm: number;
    precip_in: number;
    humidity: number;
    cloud: number;
    feelslike_c: number;
    feelslike_f: number;
    vis_km: number;
    vis_miles: number;
    uv: number;
    gust_mph: number;
    gust_kph: number;
  };
}

// Error interface for better error handling
interface WeatherError {
  message: string;
  code?: number;
  source: string;
}

export class WeatherService {
  private readonly apiKey: string;
  private readonly baseUrl: string = 'https://api.weatherapi.com/v1';

  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('WEATHER_API_KEY environment variable is not set');
    }
  }

  /**
   * Fetch weather data by coordinates using WeatherAPI.com
   */
  async fetchWeatherByCoordinates(lat: number, lon: number): Promise<WeatherData> {
    try {
      const url = `${this.baseUrl}/current.json`;
      const params = {
        key: this.apiKey,
        q: `${lat},${lon}`,
        aqi: 'no' // We don't need air quality data for flight operations
      };

      const response = await axios.get<WeatherAPIResponse>(url, { params });

      if (!response.data) {
        throw new Error('No data received from WeatherAPI.com');
      }

      return this.parseWeatherResponse(response.data, lat, lon);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const weatherError: WeatherError = {
          message: error.response?.data?.error?.message || error.message,
          code: error.response?.status,
          source: 'WeatherAPI.com'
        };
        throw new Error(`Weather API Error: ${weatherError.message} (Code: ${weatherError.code})`);
      }
      throw new Error(`Failed to fetch weather data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse WeatherAPI.com response to our WeatherData format
   */
  private parseWeatherResponse(data: WeatherAPIResponse, lat: number, lon: number): WeatherData {
    const { location, current } = data;

    return {
      location: `${location.name}, ${location.region}, ${location.country}`,
      timestamp: new Date().toISOString(),
      visibility: current.vis_miles, // Convert to statute miles for aviation
      windSpeed: current.wind_kph / 1.852, // Convert kph to knots
      windGust: current.gust_kph ? current.gust_kph / 1.852 : undefined, // Convert to knots
      temperature: current.temp_c,
      conditions: current.condition.text,
      isSafe: true, // Will be determined by weather minimums evaluation
      violatedMinimums: [], // Will be populated by weather minimums evaluation
      // Additional data that might be useful
      cloudCover: current.cloud,
      humidity: current.humidity,
      pressure: current.pressure_mb,
      windDirection: current.wind_degree,
      coordinates: { lat, lon }
    } as WeatherData & {
      cloudCover: number;
      humidity: number;
      pressure: number;
      windDirection: number;
      coordinates: { lat: number; lon: number }
    };
  }

  /**
   * Test the weather API connection with sample coordinates
   */
  async testConnection(): Promise<boolean> {
    try {
      // Test with New York coordinates
      await this.fetchWeatherByCoordinates(40.7128, -74.0060);
      return true;
    } catch (error) {
      console.error('Weather API connection test failed:', error);
      return false;
    }
  }

  /**
   * Get weather for multiple locations (useful for checking both departure and arrival)
   */
  async fetchMultipleLocationsWeather(locations: Array<{ lat: number; lon: number; name?: string }>): Promise<Array<{ location: string; weather: WeatherData }>> {
    const results = [];

    for (const loc of locations) {
      try {
        const weather = await this.fetchWeatherByCoordinates(loc.lat, loc.lon);
        results.push({
          location: loc.name || `${loc.lat}, ${loc.lon}`,
          weather
        });
      } catch (error) {
        results.push({
          location: loc.name || `${loc.lat}, ${loc.lon}`,
          weather: null as any
        });
      }
    }

    return results;
  }
}

// Export singleton instance
export const weatherService = new WeatherService();