import { z } from 'zod';

export const envSchema = z.object({
  // Server
  PORT: z.coerce.number().default(3001),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().min(1, { message: 'TELEGRAM_BOT_TOKEN is required for auth' }),

  // WhatsApp Cloud API
  WHATSAPP_API_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().default('dede_webhook_verify'),

  // Payments (Paystack)
  PAYSTACK_SECRET_KEY: z.string().optional(),

  // AI (OpenRouter)
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
  OPENROUTER_MODEL: z.string().default('openai/gpt-4o'),

  // Screenshot service (optional external service)
  SCREENSHOT_SERVICE_URL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;
