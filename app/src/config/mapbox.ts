// Mapbox configuration — reads access token from environment variable
// Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in your .env file
// See .env.example for the template

export const MAPBOX_ACCESS_TOKEN =
  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
