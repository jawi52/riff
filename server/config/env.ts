import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  JWT_SECRET: z.string().default('riff_super_secret_jwt_key_development_only_12345'),
  CACHE_DIR: z.string().default('/tmp/riff_cache'),
  MAX_STREAM_CONCURRENCY: z.coerce.number().default(4),
  RATE_LIMIT_MAX: z.coerce.number().default(60)
});

export const env = envSchema.parse(process.env);
