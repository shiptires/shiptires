-- Warehouses / distributor locations
-- Supports multiple ship-from locations per distributor (ATD, Tire Rack, etc.)

CREATE TABLE IF NOT EXISTS warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  distributor_name text NOT NULL,
  location_name text NOT NULL,
  street1 text NOT NULL,
  street2 text,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL DEFAULT 'US',
  phone text,
  contact_name text,
  is_default boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Seed the current hardcoded Sacramento warehouse
INSERT INTO warehouses (distributor_name, location_name, street1, city, state, postal_code, country, phone, contact_name, is_default)
VALUES ('Ship.Tires', 'Sacramento, CA', '1831 K Street', 'Sacramento', 'CA', '95811', 'US', '2792388473', 'Ship.Tires', true);
