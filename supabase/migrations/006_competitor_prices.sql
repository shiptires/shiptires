-- Competitor price data scraped from SimpleTire, EasyTires, GigaTires etc.
-- Used in pricing waterfall: distributor cost > competitor price > MAP fallback

CREATE TABLE IF NOT EXISTS competitor_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tire_id integer NOT NULL,              -- references tires.id in Turso
  source text NOT NULL,                  -- 'simpletire', 'easytires', 'gigatires'
  competitor_price numeric(8,2) NOT NULL,-- raw price from competitor
  competitor_url text,                   -- product URL on competitor site
  brand text NOT NULL,
  model text NOT NULL,
  size text NOT NULL,
  matched_by text NOT NULL,             -- 'mpn', 'upc', 'size_brand_model'
  match_confidence numeric(3,2) DEFAULT 1.0,
  active boolean DEFAULT true,
  scraped_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(source, tire_id)
);

CREATE INDEX idx_comp_prices_tire ON competitor_prices(tire_id) WHERE active = true;
CREATE INDEX idx_comp_prices_source ON competitor_prices(source);
CREATE INDEX idx_comp_prices_scraped ON competitor_prices(scraped_at);
