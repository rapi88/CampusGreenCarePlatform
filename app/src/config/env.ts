// Centralized environment configuration
// All EXPO_PUBLIC_* variables are automatically available via process.env
// See .env.example for the full list of required variables

const env = {
  // Mapbox
  MAPBOX_ACCESS_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '',

  // API
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
} as const;

export default env;
