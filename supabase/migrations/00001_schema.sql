-- ─────────────────────────────────────────────
-- DEDE Database Schema
-- Run this in the Supabase SQL Editor
-- ─────────────────────────────────────────────

-- 1. Subscription Plans (seed data)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  price_kobo INTEGER NOT NULL, -- Paystack uses kobo (₦1 = 100 kobo)
  features TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO subscription_plans (name, duration_days, price_kobo, features) VALUES
  ('Monthly', 30, 1000000, ARRAY['Full content feed access', '500+ daily posts', 'Custom AI generation', 'Basic analytics', 'Email support']),
  ('2 Months', 60, 1500000, ARRAY['Everything in Monthly', 'Priority AI generation', 'Advanced analytics', 'Priority support']),
  ('Quarterly', 90, 2000000, ARRAY['Everything in 2 Months', 'Brand watermark', 'Auto-publish scheduling', 'WhatsApp integration', 'Telegram integration']),
  ('Half Year', 180, 3500000, ARRAY['Everything in Quarterly', 'Dedicated virtual account', 'Bulk download', 'API access', 'Premium support']),
  ('Yearly', 365, 6000000, ARRAY['Everything in Half Year', 'White-label option', 'Multi-brand support', 'Early access to new features'])
ON CONFLICT DO NOTHING;

-- 2. Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  vibe_preference TEXT NOT NULL DEFAULT 'english' CHECK (vibe_preference IN ('pidgin', 'english')),
  brand_name TEXT,
  brand_logo_url TEXT,
  telegram_id TEXT UNIQUE,
  whatsapp_phone TEXT,
  trial_ends_at TIMESTAMPTZ,
  subscription_plan_id UUID REFERENCES subscription_plans(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 3. Contents
CREATE TABLE IF NOT EXISTS contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'generated' CHECK (type IN ('generated', 'curated', 'user_created', 'ad')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'posted', 'archived')),
  nigerian_category TEXT NOT NULL CHECK (nigerian_category IN ('politics', 'humour', 'jokes', 'hustle_motivation', 'relationship', 'quotes', 'national_commentary', 'general')),
  vibe TEXT NOT NULL CHECK (vibe IN ('pidgin', 'english')),
  aspect_ratio TEXT NOT NULL DEFAULT '1:1' CHECK (aspect_ratio IN ('1:1', '4:5', '9:16', '16:9')),
  title TEXT,
  caption TEXT,
  html_template TEXT NOT NULL,
  screenshot_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  posted_at TIMESTAMPTZ
);

CREATE INDEX idx_contents_status ON contents(status);
CREATE INDEX idx_contents_category ON contents(nigerian_category);
CREATE INDEX idx_contents_vibe ON contents(vibe);
CREATE INDEX idx_contents_created ON contents(created_at DESC);

ALTER TABLE contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ready content"
  ON contents FOR SELECT
  USING (status = 'ready' OR auth.uid() = created_by);

-- 4. Content Generation Jobs
CREATE TABLE IF NOT EXISTS content_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  prompt TEXT NOT NULL,
  aspect_ratio TEXT NOT NULL DEFAULT '1:1',
  vibe TEXT NOT NULL DEFAULT 'english' CHECK (vibe IN ('pidgin', 'english')),
  image_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result_content_id UUID REFERENCES contents(id),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE content_generation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs"
  ON content_generation_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create jobs"
  ON content_generation_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. User Subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) UNIQUE,
  plan_id UUID REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'expired', 'cancelled')),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  paystack_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- 6. Auto-Publish Jobs
CREATE TABLE IF NOT EXISTS auto_publish_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  platforms TEXT[] NOT NULL DEFAULT '{"whatsapp", "telegram"}',
  categories TEXT[] DEFAULT '{}',
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'every_6h', 'every_12h')),
  time_of_day TEXT,
  vibe TEXT CHECK (vibe IN ('pidgin', 'english')),
  active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE auto_publish_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own auto-publish"
  ON auto_publish_jobs FOR ALL
  USING (auth.uid() = user_id);

-- 7. Analytics Events
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES contents(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  platform TEXT NOT NULL CHECK (platform IN ('whatsapp', 'telegram', 'both')),
  event TEXT NOT NULL CHECK (event IN ('posted', 'viewed', 'clicked', 'shared', 'downloaded')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_content ON analytics_events(content_id);
CREATE INDEX idx_analytics_event ON analytics_events(event);
CREATE INDEX idx_analytics_created ON analytics_events(created_at DESC);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analytics"
  ON analytics_events FOR SELECT
  USING (auth.uid() = user_id);

-- 8. WhatsApp Sessions
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) UNIQUE,
  phone_number TEXT,
  access_token TEXT,
  token_expires_at TIMESTAMPTZ,
  webhook_subscribed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own WhatsApp session"
  ON whatsapp_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own WhatsApp session"
  ON whatsapp_sessions FOR ALL
  USING (auth.uid() = user_id);

-- 9. Functions & Triggers

-- Auto-update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER auto_publish_jobs_updated_at
  BEFORE UPDATE ON auto_publish_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER whatsapp_sessions_updated_at
  BEFORE UPDATE ON whatsapp_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trial expiry check (runs daily via pg_cron or external cron)
CREATE OR REPLACE FUNCTION expire_trials()
RETURNS void AS $$
BEGIN
  UPDATE user_subscriptions
  SET status = 'expired'
  WHERE status = 'trial' AND ends_at < now();

  -- Also expire active subscriptions past their end date
  UPDATE user_subscriptions
  SET status = 'expired'
  WHERE status = 'active' AND ends_at < now();
END;
$$ LANGUAGE plpgsql;
