-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  external_id TEXT UNIQUE,
  retailcrm_id TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  status TEXT DEFAULT 'new',
  city TEXT,
  address TEXT,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  utm_source TEXT,
  items JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_city ON orders(city);
CREATE INDEX IF NOT EXISTS idx_orders_utm ON orders(utm_source);

-- Enable Row Level Security but allow public read for dashboard
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON orders
  FOR SELECT USING (true);

CREATE POLICY "Allow service insert/update" ON orders
  FOR ALL USING (true) WITH CHECK (true);
