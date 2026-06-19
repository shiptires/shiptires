-- Cache Google Places installer results by zip code
-- Avoids re-fetching the same zip repeatedly, saving API costs

CREATE TABLE IF NOT EXISTS installers_cache (
  zip text PRIMARY KEY,
  city text NOT NULL,
  state text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  installers jsonb NOT NULL DEFAULT '[]'::jsonb,
  result_count integer NOT NULL DEFAULT 0,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days')
);

-- Index for finding expired entries to refresh
CREATE INDEX IF NOT EXISTS idx_installers_cache_expires ON installers_cache(expires_at);

-- Index for state/city lookups (for city pages)
CREATE INDEX IF NOT EXISTS idx_installers_cache_state_city ON installers_cache(state, city);
