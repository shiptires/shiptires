-- Dealer Program tables
-- dealer_applications: form submissions from prospective dealers
-- dealers: approved dealer accounts
-- dealer_orders: orders placed by dealers

-- ── Dealer Applications ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS dealer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  street TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  business_type TEXT NOT NULL DEFAULT 'other',
  estimated_monthly_volume TEXT,
  tax_id TEXT,
  website TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dealer_applications_status ON dealer_applications(status);
CREATE INDEX idx_dealer_applications_email ON dealer_applications(email);

-- ── Dealers (approved accounts) ──────────────────────────────
CREATE TABLE IF NOT EXISTS dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES dealer_applications(id),
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  street TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  business_type TEXT NOT NULL DEFAULT 'other',
  estimated_monthly_volume TEXT,
  tax_id TEXT,
  website TEXT,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dealers_email ON dealers(email);
CREATE INDEX idx_dealers_active ON dealers(active);

-- ── Dealer Orders ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dealer_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID NOT NULL REFERENCES dealers(id),
  stripe_session_id TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'paid',
  shipping_address JSONB,
  shipping_method TEXT,
  tracking_number TEXT,
  fulfillment_warehouse_id TEXT,
  fulfillment_location_code TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dealer_orders_dealer_id ON dealer_orders(dealer_id);
CREATE INDEX idx_dealer_orders_status ON dealer_orders(status);
CREATE INDEX idx_dealer_orders_created_at ON dealer_orders(created_at DESC);

-- ── RLS: service_role only ───────────────────────────────────
ALTER TABLE dealer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealer_orders ENABLE ROW LEVEL SECURITY;

-- No public policies — all access through API routes using service_role key
