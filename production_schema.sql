-- ============================================================
-- Unwearable Production Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ─── PAYMENTS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gateway            TEXT NOT NULL DEFAULT 'razorpay',
  gateway_order_id   TEXT UNIQUE NOT NULL,
  gateway_payment_id TEXT UNIQUE,
  amount             INTEGER NOT NULL,
  currency           TEXT NOT NULL DEFAULT 'INR',
  status             TEXT NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'captured', 'failed', 'refunded')),
  verified           BOOLEAN NOT NULL DEFAULT FALSE,
  webhook_payload    JSONB,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_gateway_order ON public.payments(gateway_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status        ON public.payments(status);

-- ─── ORDERS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number     TEXT UNIQUE NOT NULL,
  user_id          TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'processing', 'fulfilled', 'failed', 'cancelled')),
  customer_name    TEXT NOT NULL,
  customer_email   TEXT NOT NULL,
  customer_phone   TEXT,
  shipping_address JSONB NOT NULL,
  items            JSONB NOT NULL,
  subtotal         INTEGER NOT NULL DEFAULT 0,
  total_amount     INTEGER NOT NULL,
  payment_id       UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  qikink_order_id  TEXT,
  qikink_response  JSONB,
  retry_count      INTEGER NOT NULL DEFAULT 0,
  error_message    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status  ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_email   ON public.orders(customer_email);

-- ─── ERROR LOGS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.error_logs (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  context    TEXT NOT NULL,
  severity   TEXT NOT NULL DEFAULT 'error'
    CHECK (severity IN ('info', 'warn', 'error', 'critical')),
  message    TEXT NOT NULL,
  payload    JSONB,
  user_id    TEXT,
  order_id   UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logs_severity  ON public.error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_logs_context   ON public.error_logs(context);
CREATE INDEX IF NOT EXISTS idx_logs_created   ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_order_id  ON public.error_logs(order_id);

-- ─── AUTO-UPDATE updated_at ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
ALTER TABLE public.orders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Users can only read their own orders
CREATE POLICY "users_read_own_orders"
  ON public.orders FOR SELECT
  USING (auth.uid()::text = user_id);

-- Users can read payments linked to their orders
CREATE POLICY "users_read_own_payments"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.payment_id = payments.id
        AND o.user_id = auth.uid()::text
    )
  );

-- error_logs are admin-only (no user policy = blocked for anon/user)
-- Access via supabaseAdmin (service_role) only

-- ─── NOTIFY POSTGREST TO RELOAD SCHEMA ────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
