ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS meta_access_token TEXT,
  ADD COLUMN IF NOT EXISTS meta_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS meta_ad_account_id TEXT;
