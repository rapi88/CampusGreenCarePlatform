// Environment variable validation and typed config
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`❌ Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  isDev: (process.env.NODE_ENV || "development") === "development",

  database: {
    url: requireEnv("DATABASE_URL"),
  },

  jwt: {
    secret: requireEnv("JWT_SECRET"),
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  expo: {
    accessToken: process.env.EXPO_ACCESS_TOKEN || "",
  },

  upload: {
    treesDir: path.resolve(__dirname, "../../public/uploads/trees"),
    maxFileSize: 10 * 1024 * 1024, // 10 MB
  },

  supabase: {
    url: process.env.SUPABASE_URL || "",
    key:
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      "",
    usesServiceRoleKey: Boolean(
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
    buckets: {
      trees:
        process.env.SUPABASE_TREES_BUCKET ||
        process.env.SUPABASE_TREE_PHOTOS_BUCKET ||
        process.env.SUPABASE_STORAGE_BUCKET ||
        "trees",
      avatars:
        process.env.SUPABASE_AVATARS_BUCKET ||
        process.env.SUPABASE_AVATAR_BUCKET ||
        "avatars",
    },
  },

  // GPS proximity threshold for watering validation (meters)
  wateringProximityThreshold: 20, // Generous for campus GPS inaccuracy

  // Enable notification test endpoints in the admin panel
  notificationDebug: process.env.NOTIFICATION_DEBUG === "true",
};
