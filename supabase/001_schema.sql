-- ============================================
-- Relay MVP — Database Schema
-- ============================================
-- Run in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. Users
-- ============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('consumer', 'merchant')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  generation TEXT CHECK (generation IN ('gen_z', 'millennial')),  -- consumers only
  brand_name TEXT,                                                 -- merchants only
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 2. Orders (subscriptions — what the user is subscribed to)
-- ============================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_category TEXT NOT NULL,          -- skincare, supplements, haircare
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  price_cents INT NOT NULL,                -- subscription price per delivery
  cadence_days INT NOT NULL DEFAULT 30,    -- current delivery interval
  original_cadence_days INT NOT NULL DEFAULT 30,  -- what brand set originally
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 3. Transactions (actual payments / charges)
-- ============================================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount_cents INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'skipped', 'refunded')),
  charged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 4. Check-ins (consumer inventory surveys)
-- ============================================
CREATE TABLE public.checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  inventory_level TEXT NOT NULL CHECK (inventory_level IN ('full', 'halfway', 'running_low')),
  channel TEXT NOT NULL CHECK (channel IN ('imessage', 'sms')),
  responded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 5. Check-in Schedule (when & how often to survey)
-- ============================================
CREATE TABLE public.checkin_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('imessage', 'sms')),
  frequency_days INT NOT NULL DEFAULT 28,           -- how often to ask
  next_checkin_date DATE NOT NULL,                   -- when to send next check-in
  auto_adjust BOOLEAN NOT NULL DEFAULT true,         -- does frequency adapt based on responses
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 6. Delivery Schedule (delivery dates + adjustments)
-- ============================================
CREATE TABLE public.delivery_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,                      -- when delivery is planned
  actual_date DATE,                                  -- when it actually shipped (NULL = not yet)
  action TEXT NOT NULL DEFAULT 'ship' CHECK (action IN ('ship', 'delay', 'skip')),
  days_adjusted INT NOT NULL DEFAULT 0,              -- how many days shifted from original
  adjusted_by_checkin_id UUID REFERENCES public.checkins(id),  -- which check-in caused the change (NULL = no change)
  savings_cents INT NOT NULL DEFAULT 0,              -- money saved if skipped/delayed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 7. Magic Links (prototype auth/routing)
-- ============================================
CREATE TABLE public.magic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 year'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_magic_links_token ON public.magic_links(token);

-- ============================================
-- RLS — all tables locked, access via RPC only
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.magic_links ENABLE ROW LEVEL SECURITY;

-- Only magic_links readable by anon (for token lookup)
CREATE POLICY "anon_read_magic_links" ON public.magic_links FOR SELECT USING (true);

-- ============================================
-- RPC: Resolve magic link → user
-- ============================================
CREATE OR REPLACE FUNCTION public.resolve_magic_link(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_link public.magic_links%ROWTYPE;
  v_user public.users%ROWTYPE;
BEGIN
  SELECT * INTO v_link FROM public.magic_links WHERE token = p_token AND expires_at > now();
  IF v_link IS NULL THEN
    RETURN json_build_object('error', 'invalid_or_expired_token');
  END IF;

  SELECT * INTO v_user FROM public.users WHERE id = v_link.user_id;
  RETURN row_to_json(v_user);
END;
$$;

-- ============================================
-- RPC: Consumer — get own data only
-- ============================================
CREATE OR REPLACE FUNCTION public.get_consumer_data(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
BEGIN
  SELECT u.id, u.role INTO v_user_id, v_role
  FROM public.magic_links ml
  JOIN public.users u ON u.id = ml.user_id
  WHERE ml.token = p_token AND ml.expires_at > now();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'invalid_token');
  END IF;
  IF v_role != 'consumer' THEN
    RETURN json_build_object('error', 'not_a_consumer');
  END IF;

  RETURN json_build_object(
    'user', (SELECT row_to_json(u) FROM public.users u WHERE u.id = v_user_id),
    'orders', (SELECT json_agg(row_to_json(o)) FROM public.orders o WHERE o.user_id = v_user_id),
    'transactions', (SELECT json_agg(row_to_json(t)) FROM public.transactions t WHERE t.user_id = v_user_id),
    'checkins', (SELECT json_agg(row_to_json(c)) FROM public.checkins c WHERE c.user_id = v_user_id),
    'checkin_schedule', (SELECT json_agg(row_to_json(cs)) FROM public.checkin_schedule cs WHERE cs.user_id = v_user_id),
    'delivery_schedule', (SELECT json_agg(row_to_json(ds)) FROM public.delivery_schedule ds WHERE ds.user_id = v_user_id)
  );
END;
$$;

-- ============================================
-- RPC: Merchant — read ALL data (admin)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_merchant_data(p_token TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
  v_brand TEXT;
BEGIN
  SELECT u.id, u.role, u.brand_name INTO v_user_id, v_role, v_brand
  FROM public.magic_links ml
  JOIN public.users u ON u.id = ml.user_id
  WHERE ml.token = p_token AND ml.expires_at > now();

  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'invalid_token');
  END IF;
  IF v_role != 'merchant' THEN
    RETURN json_build_object('error', 'not_a_merchant');
  END IF;

  RETURN json_build_object(
    'merchant', (SELECT row_to_json(u) FROM public.users u WHERE u.id = v_user_id),
    'users', (SELECT json_agg(row_to_json(u)) FROM public.users u WHERE u.role = 'consumer'),
    'orders', (SELECT json_agg(row_to_json(o)) FROM public.orders o),
    'transactions', (SELECT json_agg(row_to_json(t)) FROM public.transactions t),
    'checkins', (SELECT json_agg(row_to_json(c)) FROM public.checkins c),
    'checkin_schedule', (SELECT json_agg(row_to_json(cs)) FROM public.checkin_schedule cs),
    'delivery_schedule', (SELECT json_agg(row_to_json(ds)) FROM public.delivery_schedule ds)
  );
END;
$$;

-- ============================================
-- RPC: Consumer submits a check-in
-- ============================================
CREATE OR REPLACE FUNCTION public.submit_checkin(
  p_token TEXT,
  p_order_id UUID,
  p_inventory_level TEXT
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_role TEXT;
  v_channel TEXT;
  v_checkin_id UUID;
  v_action TEXT;
  v_days INT;
  v_savings INT;
  v_price INT;
  v_next_delivery DATE;
BEGIN
  -- Auth
  SELECT u.id, u.role, u.generation INTO v_user_id, v_role
  FROM public.magic_links ml
  JOIN public.users u ON u.id = ml.user_id
  WHERE ml.token = p_token AND ml.expires_at > now();

  IF v_user_id IS NULL THEN RETURN json_build_object('error', 'invalid_token'); END IF;
  IF v_role != 'consumer' THEN RETURN json_build_object('error', 'not_a_consumer'); END IF;

  -- Verify order belongs to user
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id = p_order_id AND user_id = v_user_id) THEN
    RETURN json_build_object('error', 'order_not_found');
  END IF;

  -- Get channel from schedule
  SELECT cs.channel INTO v_channel FROM public.checkin_schedule cs WHERE cs.order_id = p_order_id AND cs.user_id = v_user_id;
  IF v_channel IS NULL THEN v_channel := 'sms'; END IF;

  -- Determine action based on inventory bucket
  SELECT o.price_cents INTO v_price FROM public.orders o WHERE o.id = p_order_id;

  CASE p_inventory_level
    WHEN 'full' THEN v_action := 'skip'; v_days := 30; v_savings := v_price;
    WHEN 'halfway' THEN v_action := 'delay'; v_days := 14; v_savings := 0;
    WHEN 'running_low' THEN v_action := 'ship'; v_days := 0; v_savings := 0;
    ELSE RETURN json_build_object('error', 'invalid_inventory_level');
  END CASE;

  -- Insert check-in
  INSERT INTO public.checkins (order_id, user_id, inventory_level, channel)
  VALUES (p_order_id, v_user_id, p_inventory_level, v_channel)
  RETURNING id INTO v_checkin_id;

  -- Update next delivery in delivery_schedule (find the nearest upcoming)
  UPDATE public.delivery_schedule
  SET action = v_action,
      days_adjusted = v_days,
      adjusted_by_checkin_id = v_checkin_id,
      savings_cents = v_savings,
      actual_date = CASE WHEN v_action = 'ship' THEN scheduled_date ELSE NULL END,
      scheduled_date = CASE WHEN v_action = 'delay' THEN scheduled_date + v_days ELSE scheduled_date END
  WHERE id = (
    SELECT id FROM public.delivery_schedule
    WHERE order_id = p_order_id AND user_id = v_user_id AND actual_date IS NULL AND action = 'ship'
    ORDER BY scheduled_date ASC LIMIT 1
  );

  -- Update checkin_schedule next date
  UPDATE public.checkin_schedule
  SET next_checkin_date = CURRENT_DATE + frequency_days,
      updated_at = now()
  WHERE order_id = p_order_id AND user_id = v_user_id;

  RETURN json_build_object(
    'success', true,
    'checkin_id', v_checkin_id,
    'action', v_action,
    'days_adjusted', v_days,
    'savings_cents', v_savings
  );
END;
$$;
