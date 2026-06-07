import type { z } from 'zod';
import type {
  ProfileSchema,
  ContentSchema,
  SubscriptionPlanSchema,
  UserSubscriptionSchema,
  AutoPublishJobSchema,
  AnalyticsEventSchema,
} from './schemas.js';

export type Profile = z.infer<typeof ProfileSchema>;
export type Content = z.infer<typeof ContentSchema>;
export type SubscriptionPlan = z.infer<typeof SubscriptionPlanSchema>;
export type UserSubscription = z.infer<typeof UserSubscriptionSchema>;
export type AutoPublishJob = z.infer<typeof AutoPublishJobSchema>;
export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;
