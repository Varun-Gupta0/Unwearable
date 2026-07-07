import { z } from 'zod';

// Load and validate environment variables
const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1),
  CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  QIKINK_API_KEY: z.string().min(1),
  // Feature flags (optional)
  ENABLE_DESIGN_BUILDER: z.enum(['true', 'false']).optional(),
  ENABLE_PAYMENTS: z.enum(['true', 'false']).optional(),
}).strict();

const env = envSchema.parse(process.env);

export const Config = {
  supabase: {
    url: env.SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: env.SUPABASE_ANON_KEY,
  },
  clerk: {
    publishableKey: env.CLERK_PUBLISHABLE_KEY,
    secretKey: env.CLERK_SECRET_KEY,
  },
  razorpay: {
    keyId: env.RAZORPAY_KEY_ID,
    keySecret: env.RAZORPAY_KEY_SECRET,
  },
  qikink: {
    apiKey: env.QIKINK_API_KEY,
  },
  featureFlags: {
    designBuilder: env.ENABLE_DESIGN_BUILDER === 'true',
    payments: env.ENABLE_PAYMENTS === 'true',
  },
} as const;

export type ConfigType = typeof Config;
