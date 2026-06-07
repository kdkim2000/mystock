import 'server-only'
import { z } from 'zod'

const envSchema = z.object({
  AUTH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_SPREADSHEET_ID: z.string().min(1),
  GOOGLE_SHEET_NAME: z.string().default('매매내역'),
  GOOGLE_SHEET_TICKER_MASTER: z.string().optional(),
  GOOGLE_SHEET_AGGREGATION: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  GOOGLE_SERVICE_ACCOUNT_JSON: z.string().optional(),
  DART_API_KEY: z.string().min(1),
  KIS_APP_KEY: z.string().min(1),
  KIS_APP_SECRET: z.string().min(1),
  KIS_APP_SVR: z.enum(['prod', 'vps']).default('prod'),
  KIS_THROTTLE_MS: z.coerce.number().default(400),
  OPENAI_API_KEY: z.string().startsWith('sk-'),
  ALLOWED_EMAIL: z.string().email().optional(),
})

export const env = envSchema.parse(process.env)
export type Env = z.infer<typeof envSchema>
