CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  product TEXT,
  platforms TEXT[],
  copies JSONB,
  images JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
