import axios from 'axios';

export interface WeatherResponse {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
}

export const weatherApi = {
  getForecast: (latitude: number, longitude: number) =>
    axios.get<WeatherResponse>('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude,
        longitude,
        current:
          'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
        daily:
          'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
        timezone: 'auto',
        forecast_days: 5,
      },
      timeout: 15000,
    }),
};
