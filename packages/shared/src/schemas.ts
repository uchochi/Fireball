import { z } from 'zod';

// ── Nigerian vibe / category enums ──
export const NigerianCategory = z.enum([
  'politics',
  'humour',
  'jokes',
  'hustle_motivation',
  'relationship',
  'quotes',
  'national_commentary',
  'general',
]);
export type NigerianCategory = z.infer<typeof NigerianCategory>;

export const Vibe = z.enum(['pidgin', 'english']);
export type Vibe = z.infer<typeof Vibe>;

export const AspectRatio = z.enum(['1:1', '4:5', '9:16', '16:9']);
export type AspectRatio = z.infer<typeof AspectRatio>;

export const ContentType = z.enum(['generated', 'curated', 'user_created', 'ad']);
export type ContentType = z.infer<typeof ContentType>;

export const ContentStatus = z.enum(['draft', 'ready', 'posted', 'archived']);
export type ContentStatus = z.infer<typeof ContentStatus>;

export const Platform = z.enum(['whatsapp', 'telegram', 'both']);
export type Platform = z.infer<typeof Platform>;

// ── Profile ──
export const ProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().optional(),
  display_name: z.string().min(1).max(100).optional(),
  vibe_preference: Vibe.default('english'),
  brand_name: z.string().max(100).optional(),
  brand_logo_url: z.string().url().optional(),
  telegram_id: z.string().optional(),
  whatsapp_phone: z.string().optional(),
  trial_ends_at: z.string().datetime().optional(),
  subscription_plan_id: z.string().uuid().optional(),
  created_at: z.string().datetime(),
});
export type Profile = z.infer<typeof ProfileSchema>;

// ── Content ──
export const ContentSchema = z.object({
  id: z.string().uuid(),
  type: ContentType,
  status: ContentStatus.default('ready'),
  nigerian_category: NigerianCategory,
  vibe: Vibe,
  aspect_ratio: AspectRatio,
  title: z.string().max(200).optional(),
  caption: z.string().optional(),
  html_template: z.string(),
  screenshot_url: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
  created_by: z.string().uuid().optional(),
  created_at: z.string().datetime(),
});
export type Content = z.infer<typeof ContentSchema>;

// ── Subscription Plan ──
export const SubscriptionPlanSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  duration_days: z.number().int().positive(),
  price_kobo: z.number().int().positive(),
  features: z.array(z.string()),
  active: z.boolean().default(true),
});
export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>;

// ── User Subscription ──
export const UserSubscriptionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  plan_id: z.string().uuid(),
  status: z.enum(['trial', 'active', 'expired', 'cancelled']),
  starts_at: z.string().datetime(),
  ends_at: z.string().datetime(),
  paystack_ref: z.string().optional(),
});
export type UserSubscription = z.infer<typeof UserSubscriptionSchema>;

// ── Auto Publish Job ──
export const AutoPublishJobSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  platforms: z.array(Platform),
  categories: z.array(NigerianCategory).optional(),
  frequency: z.enum(['daily', 'every_6h', 'every_12h']),
  time_of_day: z.string().optional(),
  vibe: Vibe.optional(),
  active: z.boolean().default(true),
  last_run_at: z.string().datetime().optional(),
  next_run_at: z.string().datetime().optional(),
});
export type AutoPublishJob = z.infer<typeof AutoPublishJobSchema>;

// ── Analytics Event ──
export const AnalyticsEventSchema = z.object({
  id: z.string().uuid(),
  content_id: z.string().uuid(),
  user_id: z.string().uuid(),
  platform: Platform,
  event: z.enum(['posted', 'viewed', 'clicked', 'shared', 'downloaded']),
  metadata: z.record(z.unknown()).optional(),
  created_at: z.string().datetime(),
});
export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;
