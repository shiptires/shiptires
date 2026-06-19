-- Distributors — supplier/wholesale companies we buy tires from
-- Each distributor can have multiple warehouses (via warehouses table)

CREATE TABLE IF NOT EXISTS distributors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  street1 text,
  street2 text,
  city text,
  state text,
  postal_code text,
  country text NOT NULL DEFAULT 'US',
  phone text,
  fax text,
  email text,
  contact_name text,
  website text,
  notes text,
  default_shipping_cost numeric(8,2) NOT NULL DEFAULT 55.00,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Link warehouses to distributors
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS distributor_id uuid REFERENCES distributors(id);

-- Distributor inventory — what each distributor has in stock and at what cost
CREATE TABLE IF NOT EXISTS distributor_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  distributor_id uuid NOT NULL REFERENCES distributors(id) ON DELETE CASCADE,
  tire_id integer NOT NULL,                    -- references tires.id in Turso
  cost numeric(8,2) NOT NULL,                  -- distributor buy price per tire
  quantity integer NOT NULL DEFAULT 0,         -- current stock
  part_number text,                            -- distributor's part/SKU
  brand text NOT NULL,                         -- denormalized for quick lookup
  model text NOT NULL,                         -- denormalized
  size text NOT NULL,                          -- e.g. "255/75R17"
  active boolean DEFAULT true,
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- One entry per distributor per tire
  UNIQUE(distributor_id, tire_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_dist_inv_distributor ON distributor_inventory(distributor_id) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_dist_inv_tire ON distributor_inventory(tire_id) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_dist_inv_brand ON distributor_inventory(brand);
CREATE INDEX IF NOT EXISTS idx_distributors_slug ON distributors(slug);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER distributors_updated_at
  BEFORE UPDATE ON distributors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER dist_inventory_updated_at
  BEFORE UPDATE ON distributor_inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed TD Wholesale as the first distributor
INSERT INTO distributors (name, slug, street1, city, state, postal_code, phone, fax, email, contact_name, default_shipping_cost)
VALUES (
  'TD Wholesale',
  'td-wholesale',
  '3158 Transworld Dr',
  'Stockton',
  'CA',
  '95206',
  '(209) 939-9330',
  '(209) 939-9153',
  'sales@tires209.com',
  'TD Wholesale',
  55.00
);
