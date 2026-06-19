-- 007: TireHub SFTP inventory integration
-- Adds location_code to warehouses for matching against CSV feed columns
-- Adds warehouse_quantities JSONB to distributor_inventory for per-warehouse stock

ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS location_code TEXT;

-- Index for quick lookup by location_code
CREATE INDEX IF NOT EXISTS idx_warehouses_location_code ON warehouses (location_code) WHERE location_code IS NOT NULL;

ALTER TABLE distributor_inventory
  ADD COLUMN IF NOT EXISTS warehouse_quantities JSONB DEFAULT '{}';

-- Track when a distributor's inventory was last synced via SFTP/cron
ALTER TABLE distributors
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;
