-- Add phone_number column for Telegram phone number
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Index for looking up by phone number
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON profiles(phone_number);
