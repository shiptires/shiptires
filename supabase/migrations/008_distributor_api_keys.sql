-- Add API key support for distributors to upload inventory to us
-- Each distributor gets a unique API key they can use to push inventory via API or automated uploads

ALTER TABLE distributors ADD COLUMN IF NOT EXISTS api_key_hash TEXT;
ALTER TABLE distributors ADD COLUMN IF NOT EXISTS api_key_prefix TEXT; -- first 8 chars for identification

CREATE INDEX IF NOT EXISTS idx_distributors_api_key_hash ON distributors (api_key_hash) WHERE api_key_hash IS NOT NULL;

-- Track upload history for auditing
CREATE TABLE IF NOT EXISTS distributor_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distributor_id UUID NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,
  filename TEXT,
  method TEXT NOT NULL DEFAULT 'api', -- 'api' or 'sftp'
  rows_total INTEGER DEFAULT 0,
  rows_matched INTEGER DEFAULT 0,
  rows_unmatched INTEGER DEFAULT 0,
  rows_zeroed INTEGER DEFAULT 0,
  errors TEXT[] DEFAULT '{}',
  duration_ms INTEGER DEFAULT 0,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dist_uploads_distributor ON distributor_uploads (distributor_id);
CREATE INDEX IF NOT EXISTS idx_dist_uploads_created ON distributor_uploads (created_at DESC);
