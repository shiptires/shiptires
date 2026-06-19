-- ============================================================
-- Ship.Tires — Shipping / Tracking Columns
-- ============================================================

ALTER TABLE tire_orders ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE tire_orders ADD COLUMN IF NOT EXISTS carrier text;
ALTER TABLE tire_orders ADD COLUMN IF NOT EXISTS service_code text;
ALTER TABLE tire_orders ADD COLUMN IF NOT EXISTS shipment_cost numeric;
ALTER TABLE tire_orders ADD COLUMN IF NOT EXISTS shipment_id text;
ALTER TABLE tire_orders ADD COLUMN IF NOT EXISTS label_url text;
ALTER TABLE tire_orders ADD COLUMN IF NOT EXISTS shipped_at timestamptz;
