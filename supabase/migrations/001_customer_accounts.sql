-- ============================================================
-- Ship.Tires — Customer Accounts Migration
-- ============================================================

-- 1. Add columns to tire_orders for Stripe + auth linking
ALTER TABLE tire_orders
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_email text,
  ADD COLUMN IF NOT EXISTS shipping_address jsonb,
  ADD COLUMN IF NOT EXISTS total numeric,
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_tire_orders_auth_user ON tire_orders(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_tire_orders_email ON tire_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_tire_orders_stripe_session ON tire_orders(stripe_session_id);

-- 2. Create customer_profiles table
CREATE TABLE IF NOT EXISTS customer_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  phone text DEFAULT '',
  avatar_url text DEFAULT '',
  vehicles jsonb DEFAULT '[]'::jsonb,
  saved_addresses jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_profiles_email ON customer_profiles(email);

-- 3. Add auth_user_id to tire_customers for cross-referencing
ALTER TABLE tire_customers
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_tire_customers_auth_user ON tire_customers(auth_user_id);

-- 4. RLS policies — customers can only see their own data

-- customer_profiles
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON customer_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON customer_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON customer_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Service role bypass (for admin/webhook operations)
CREATE POLICY "Service role full access to profiles"
  ON customer_profiles FOR ALL
  USING (auth.role() = 'service_role');

-- tire_orders — customers see their own orders
ALTER TABLE tire_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON tire_orders FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Service role full access to orders"
  ON tire_orders FOR ALL
  USING (auth.role() = 'service_role');

-- 5. Trigger: auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.customer_profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture', '')
  );

  -- Retroactively link any guest orders placed with this email
  UPDATE public.tire_orders
  SET auth_user_id = NEW.id
  WHERE customer_email = NEW.email
    AND auth_user_id IS NULL;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Migrate existing orders data into tire_orders (if orders table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public') THEN
    INSERT INTO public.tire_orders (stripe_session_id, customer_name, customer_email, shipping_address, items, total, status, created_at)
    SELECT
      stripe_session_id,
      customer_name,
      customer_email,
      shipping_address,
      items,
      total,
      status,
      created_at
    FROM public.orders
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;
