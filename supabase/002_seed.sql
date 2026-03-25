-- ============================================
-- Relay MVP — Seed Data
-- ============================================

-- ============================================
-- Users
-- ============================================

-- Consumers — Gen Z
INSERT INTO public.users (id, role, full_name, email, phone, generation) VALUES
  ('c1a00000-0000-0000-0000-000000000001', 'consumer', 'Chloe Park', 'chloe@example.com', '+1-718-555-0101', 'gen_z'),
  ('c1a00000-0000-0000-0000-000000000002', 'consumer', 'Maya Rodriguez', 'maya@example.com', '+1-213-555-0102', 'gen_z'),
  ('c1a00000-0000-0000-0000-000000000003', 'consumer', 'Jade Kim', 'jade@example.com', '+1-415-555-0103', 'gen_z');

-- Consumers — Millennial
INSERT INTO public.users (id, role, full_name, email, phone, generation) VALUES
  ('c1a00000-0000-0000-0000-000000000004', 'consumer', 'Marcus Chen', 'marcus@example.com', '+1-303-555-0104', 'millennial'),
  ('c1a00000-0000-0000-0000-000000000005', 'consumer', 'Sarah Mitchell', 'sarah@example.com', '+1-512-555-0105', 'millennial'),
  ('c1a00000-0000-0000-0000-000000000006', 'consumer', 'David Park', 'david@example.com', '+1-206-555-0106', 'millennial');

-- Merchants
INSERT INTO public.users (id, role, full_name, email, brand_name) VALUES
  ('a1b00000-0000-0000-0000-000000000001', 'merchant', 'Emma Wilson', 'emma@topicals.com', 'Topicals'),
  ('a1b00000-0000-0000-0000-000000000002', 'merchant', 'Alex Turner', 'alex@drinkag1.com', 'AG1');

-- ============================================
-- Orders (subscriptions)
-- ============================================

-- Chloe (Gen Z) — 3 subscriptions
INSERT INTO public.orders (id, user_id, product_name, product_category, status, price_cents, cadence_days, original_cadence_days) VALUES
  ('d1a00000-0000-0000-0000-000000000001', 'c1a00000-0000-0000-0000-000000000001', 'Faded Serum', 'skincare', 'active', 3600, 42, 30),
  ('d1a00000-0000-0000-0000-000000000002', 'c1a00000-0000-0000-0000-000000000001', 'DS-01 Daily Synbiotic', 'supplements', 'active', 4999, 30, 30),
  ('d1a00000-0000-0000-0000-000000000003', 'c1a00000-0000-0000-0000-000000000001', 'Boy Brow', 'skincare', 'active', 1700, 75, 60);

-- Maya (Gen Z) — 2 subscriptions
INSERT INTO public.orders (id, user_id, product_name, product_category, status, price_cents, cadence_days, original_cadence_days) VALUES
  ('d1a00000-0000-0000-0000-000000000004', 'c1a00000-0000-0000-0000-000000000002', 'Faded Serum', 'skincare', 'active', 3600, 38, 30),
  ('d1a00000-0000-0000-0000-000000000005', 'c1a00000-0000-0000-0000-000000000002', 'Milky Jelly Cleanser', 'skincare', 'active', 1800, 45, 45);

-- Jade (Gen Z) — 1 subscription, new
INSERT INTO public.orders (id, user_id, product_name, product_category, status, price_cents, cadence_days, original_cadence_days) VALUES
  ('d1a00000-0000-0000-0000-000000000006', 'c1a00000-0000-0000-0000-000000000003', 'Faded Serum', 'skincare', 'active', 3600, 30, 30);

-- Marcus (Millennial) — 4 subscriptions
INSERT INTO public.orders (id, user_id, product_name, product_category, status, price_cents, cadence_days, original_cadence_days) VALUES
  ('d1a00000-0000-0000-0000-000000000007', 'c1a00000-0000-0000-0000-000000000004', 'AG1 Daily Greens', 'supplements', 'active', 7900, 38, 30),
  ('d1a00000-0000-0000-0000-000000000008', 'c1a00000-0000-0000-0000-000000000004', 'DS-01 Daily Synbiotic', 'supplements', 'active', 4999, 35, 30),
  ('d1a00000-0000-0000-0000-000000000009', 'c1a00000-0000-0000-0000-000000000004', 'Faded Serum', 'skincare', 'active', 3600, 45, 30),
  ('d1a00000-0000-0000-0000-000000000010', 'c1a00000-0000-0000-0000-000000000004', 'Minoxidil Solution', 'haircare', 'active', 1500, 30, 30);

-- Sarah (Millennial) — 3 subscriptions
INSERT INTO public.orders (id, user_id, product_name, product_category, status, price_cents, cadence_days, original_cadence_days) VALUES
  ('d1a00000-0000-0000-0000-000000000011', 'c1a00000-0000-0000-0000-000000000005', 'Faded Serum', 'skincare', 'active', 3600, 50, 30),
  ('d1a00000-0000-0000-0000-000000000012', 'c1a00000-0000-0000-0000-000000000005', 'AG1 Daily Greens', 'supplements', 'active', 7900, 30, 30),
  ('d1a00000-0000-0000-0000-000000000013', 'c1a00000-0000-0000-0000-000000000005', 'Finasteride', 'supplements', 'active', 2500, 30, 30);

-- David (Millennial) — 2 subscriptions
INSERT INTO public.orders (id, user_id, product_name, product_category, status, price_cents, cadence_days, original_cadence_days) VALUES
  ('d1a00000-0000-0000-0000-000000000014', 'c1a00000-0000-0000-0000-000000000006', 'AG1 Daily Greens', 'supplements', 'active', 7900, 42, 30),
  ('d1a00000-0000-0000-0000-000000000015', 'c1a00000-0000-0000-0000-000000000006', 'Minoxidil Solution', 'haircare', 'active', 1500, 35, 30);

-- ============================================
-- Transactions (payment history)
-- ============================================

-- Chloe — Faded Serum (adapted: some skipped)
INSERT INTO public.transactions (order_id, user_id, amount_cents, status, charged_at) VALUES
  ('d1a00000-0000-0000-0000-000000000001', 'c1a00000-0000-0000-0000-000000000001', 3600, 'paid', '2025-12-15'),
  ('d1a00000-0000-0000-0000-000000000001', 'c1a00000-0000-0000-0000-000000000001', 0, 'skipped', '2026-01-14'),
  ('d1a00000-0000-0000-0000-000000000001', 'c1a00000-0000-0000-0000-000000000001', 3600, 'paid', '2026-02-25'),
  ('d1a00000-0000-0000-0000-000000000001', 'c1a00000-0000-0000-0000-000000000001', 3600, 'paid', '2026-03-08');

-- Chloe — DS-01 (steady)
INSERT INTO public.transactions (order_id, user_id, amount_cents, status, charged_at) VALUES
  ('d1a00000-0000-0000-0000-000000000002', 'c1a00000-0000-0000-0000-000000000001', 4999, 'paid', '2026-01-02'),
  ('d1a00000-0000-0000-0000-000000000002', 'c1a00000-0000-0000-0000-000000000001', 4999, 'paid', '2026-02-01'),
  ('d1a00000-0000-0000-0000-000000000002', 'c1a00000-0000-0000-0000-000000000001', 4999, 'paid', '2026-03-03');

-- Marcus — AG1 (adapted)
INSERT INTO public.transactions (order_id, user_id, amount_cents, status, charged_at) VALUES
  ('d1a00000-0000-0000-0000-000000000007', 'c1a00000-0000-0000-0000-000000000004', 7900, 'paid', '2025-12-05'),
  ('d1a00000-0000-0000-0000-000000000007', 'c1a00000-0000-0000-0000-000000000004', 7900, 'paid', '2026-01-12'),
  ('d1a00000-0000-0000-0000-000000000007', 'c1a00000-0000-0000-0000-000000000004', 0, 'skipped', '2026-02-08'),
  ('d1a00000-0000-0000-0000-000000000007', 'c1a00000-0000-0000-0000-000000000004', 7900, 'paid', '2026-03-10');

-- Marcus — DS-01 (adapted)
INSERT INTO public.transactions (order_id, user_id, amount_cents, status, charged_at) VALUES
  ('d1a00000-0000-0000-0000-000000000008', 'c1a00000-0000-0000-0000-000000000004', 4999, 'paid', '2025-12-20'),
  ('d1a00000-0000-0000-0000-000000000008', 'c1a00000-0000-0000-0000-000000000004', 0, 'skipped', '2026-01-20'),
  ('d1a00000-0000-0000-0000-000000000008', 'c1a00000-0000-0000-0000-000000000004', 4999, 'paid', '2026-02-24'),
  ('d1a00000-0000-0000-0000-000000000008', 'c1a00000-0000-0000-0000-000000000004', 4999, 'paid', '2026-03-22');

-- Marcus — Faded Serum
INSERT INTO public.transactions (order_id, user_id, amount_cents, status, charged_at) VALUES
  ('d1a00000-0000-0000-0000-000000000009', 'c1a00000-0000-0000-0000-000000000004', 3600, 'paid', '2025-12-25'),
  ('d1a00000-0000-0000-0000-000000000009', 'c1a00000-0000-0000-0000-000000000004', 0, 'skipped', '2026-01-25'),
  ('d1a00000-0000-0000-0000-000000000009', 'c1a00000-0000-0000-0000-000000000004', 3600, 'paid', '2026-03-01');

-- Sarah — Faded Serum (heavy adapter)
INSERT INTO public.transactions (order_id, user_id, amount_cents, status, charged_at) VALUES
  ('d1a00000-0000-0000-0000-000000000011', 'c1a00000-0000-0000-0000-000000000005', 3600, 'paid', '2025-12-05'),
  ('d1a00000-0000-0000-0000-000000000011', 'c1a00000-0000-0000-0000-000000000005', 0, 'skipped', '2026-01-05'),
  ('d1a00000-0000-0000-0000-000000000011', 'c1a00000-0000-0000-0000-000000000005', 0, 'skipped', '2026-02-05'),
  ('d1a00000-0000-0000-0000-000000000011', 'c1a00000-0000-0000-0000-000000000005', 3600, 'paid', '2026-03-10');

-- David — AG1
INSERT INTO public.transactions (order_id, user_id, amount_cents, status, charged_at) VALUES
  ('d1a00000-0000-0000-0000-000000000014', 'c1a00000-0000-0000-0000-000000000006', 7900, 'paid', '2026-01-10'),
  ('d1a00000-0000-0000-0000-000000000014', 'c1a00000-0000-0000-0000-000000000006', 0, 'skipped', '2026-02-10'),
  ('d1a00000-0000-0000-0000-000000000014', 'c1a00000-0000-0000-0000-000000000006', 7900, 'paid', '2026-03-12');

-- ============================================
-- Check-ins (historical survey responses)
-- ============================================

-- Chloe — Faded Serum
INSERT INTO public.checkins (id, order_id, user_id, inventory_level, channel, responded_at) VALUES
  ('e1a00000-0000-0000-0000-000000000001', 'd1a00000-0000-0000-0000-000000000001', 'c1a00000-0000-0000-0000-000000000001', 'full', 'imessage', '2026-01-12 10:30:00+00'),
  ('e1a00000-0000-0000-0000-000000000002', 'd1a00000-0000-0000-0000-000000000001', 'c1a00000-0000-0000-0000-000000000001', 'halfway', 'imessage', '2026-02-14 09:15:00+00'),
  ('e1a00000-0000-0000-0000-000000000003', 'd1a00000-0000-0000-0000-000000000001', 'c1a00000-0000-0000-0000-000000000001', 'running_low', 'imessage', '2026-03-06 11:00:00+00'),
  ('e1a00000-0000-0000-0000-000000000004', 'd1a00000-0000-0000-0000-000000000001', 'c1a00000-0000-0000-0000-000000000001', 'full', 'imessage', '2026-03-18 08:45:00+00');

-- Chloe — Boy Brow
INSERT INTO public.checkins (id, order_id, user_id, inventory_level, channel, responded_at) VALUES
  ('e1a00000-0000-0000-0000-000000000005', 'd1a00000-0000-0000-0000-000000000003', 'c1a00000-0000-0000-0000-000000000001', 'halfway', 'imessage', '2026-02-28 14:00:00+00');

-- Maya — Faded Serum
INSERT INTO public.checkins (id, order_id, user_id, inventory_level, channel, responded_at) VALUES
  ('e1a00000-0000-0000-0000-000000000006', 'd1a00000-0000-0000-0000-000000000004', 'c1a00000-0000-0000-0000-000000000002', 'full', 'imessage', '2026-02-01 12:00:00+00'),
  ('e1a00000-0000-0000-0000-000000000007', 'd1a00000-0000-0000-0000-000000000004', 'c1a00000-0000-0000-0000-000000000002', 'halfway', 'imessage', '2026-03-05 10:30:00+00'),
  ('e1a00000-0000-0000-0000-000000000008', 'd1a00000-0000-0000-0000-000000000004', 'c1a00000-0000-0000-0000-000000000002', 'running_low', 'imessage', '2026-03-18 09:00:00+00');

-- Marcus — AG1
INSERT INTO public.checkins (id, order_id, user_id, inventory_level, channel, responded_at) VALUES
  ('e1a00000-0000-0000-0000-000000000009', 'd1a00000-0000-0000-0000-000000000007', 'c1a00000-0000-0000-0000-000000000004', 'halfway', 'sms', '2026-01-08 07:30:00+00'),
  ('e1a00000-0000-0000-0000-000000000010', 'd1a00000-0000-0000-0000-000000000007', 'c1a00000-0000-0000-0000-000000000004', 'running_low', 'sms', '2026-02-06 07:15:00+00'),
  ('e1a00000-0000-0000-0000-000000000011', 'd1a00000-0000-0000-0000-000000000007', 'c1a00000-0000-0000-0000-000000000004', 'halfway', 'sms', '2026-03-08 07:45:00+00');

-- Marcus — DS-01
INSERT INTO public.checkins (id, order_id, user_id, inventory_level, channel, responded_at) VALUES
  ('e1a00000-0000-0000-0000-000000000012', 'd1a00000-0000-0000-0000-000000000008', 'c1a00000-0000-0000-0000-000000000004', 'full', 'sms', '2026-01-18 08:00:00+00'),
  ('e1a00000-0000-0000-0000-000000000013', 'd1a00000-0000-0000-0000-000000000008', 'c1a00000-0000-0000-0000-000000000004', 'halfway', 'sms', '2026-02-22 07:30:00+00'),
  ('e1a00000-0000-0000-0000-000000000014', 'd1a00000-0000-0000-0000-000000000008', 'c1a00000-0000-0000-0000-000000000004', 'running_low', 'sms', '2026-03-13 08:15:00+00'),
  ('e1a00000-0000-0000-0000-000000000015', 'd1a00000-0000-0000-0000-000000000008', 'c1a00000-0000-0000-0000-000000000004', 'full', 'sms', '2026-03-20 07:00:00+00');

-- Marcus — Faded Serum
INSERT INTO public.checkins (id, order_id, user_id, inventory_level, channel, responded_at) VALUES
  ('e1a00000-0000-0000-0000-000000000016', 'd1a00000-0000-0000-0000-000000000009', 'c1a00000-0000-0000-0000-000000000004', 'full', 'sms', '2026-01-23 08:30:00+00'),
  ('e1a00000-0000-0000-0000-000000000017', 'd1a00000-0000-0000-0000-000000000009', 'c1a00000-0000-0000-0000-000000000004', 'halfway', 'sms', '2026-02-27 07:45:00+00');

-- Sarah — Faded Serum
INSERT INTO public.checkins (id, order_id, user_id, inventory_level, channel, responded_at) VALUES
  ('e1a00000-0000-0000-0000-000000000018', 'd1a00000-0000-0000-0000-000000000011', 'c1a00000-0000-0000-0000-000000000005', 'full', 'sms', '2026-01-03 09:00:00+00'),
  ('e1a00000-0000-0000-0000-000000000019', 'd1a00000-0000-0000-0000-000000000011', 'c1a00000-0000-0000-0000-000000000005', 'full', 'sms', '2026-02-03 09:30:00+00'),
  ('e1a00000-0000-0000-0000-000000000020', 'd1a00000-0000-0000-0000-000000000011', 'c1a00000-0000-0000-0000-000000000005', 'halfway', 'sms', '2026-03-08 10:00:00+00');

-- David — AG1
INSERT INTO public.checkins (id, order_id, user_id, inventory_level, channel, responded_at) VALUES
  ('e1a00000-0000-0000-0000-000000000021', 'd1a00000-0000-0000-0000-000000000014', 'c1a00000-0000-0000-0000-000000000006', 'halfway', 'sms', '2026-02-08 06:30:00+00'),
  ('e1a00000-0000-0000-0000-000000000022', 'd1a00000-0000-0000-0000-000000000014', 'c1a00000-0000-0000-0000-000000000006', 'running_low', 'sms', '2026-03-10 07:00:00+00');

-- ============================================
-- Check-in Schedule
-- ============================================

-- Chloe
INSERT INTO public.checkin_schedule (order_id, user_id, channel, frequency_days, next_checkin_date) VALUES
  ('d1a00000-0000-0000-0000-000000000001', 'c1a00000-0000-0000-0000-000000000001', 'imessage', 40, '2026-04-05'),
  ('d1a00000-0000-0000-0000-000000000002', 'c1a00000-0000-0000-0000-000000000001', 'imessage', 28, '2026-03-30'),
  ('d1a00000-0000-0000-0000-000000000003', 'c1a00000-0000-0000-0000-000000000001', 'imessage', 70, '2026-04-15');

-- Maya
INSERT INTO public.checkin_schedule (order_id, user_id, channel, frequency_days, next_checkin_date) VALUES
  ('d1a00000-0000-0000-0000-000000000004', 'c1a00000-0000-0000-0000-000000000002', 'imessage', 35, '2026-04-02'),
  ('d1a00000-0000-0000-0000-000000000005', 'c1a00000-0000-0000-0000-000000000002', 'imessage', 42, '2026-04-12');

-- Jade (new, default frequency)
INSERT INTO public.checkin_schedule (order_id, user_id, channel, frequency_days, next_checkin_date) VALUES
  ('d1a00000-0000-0000-0000-000000000006', 'c1a00000-0000-0000-0000-000000000003', 'imessage', 28, '2026-03-28');

-- Marcus
INSERT INTO public.checkin_schedule (order_id, user_id, channel, frequency_days, next_checkin_date) VALUES
  ('d1a00000-0000-0000-0000-000000000007', 'c1a00000-0000-0000-0000-000000000004', 'sms', 36, '2026-04-07'),
  ('d1a00000-0000-0000-0000-000000000008', 'c1a00000-0000-0000-0000-000000000004', 'sms', 33, '2026-04-03'),
  ('d1a00000-0000-0000-0000-000000000009', 'c1a00000-0000-0000-0000-000000000004', 'sms', 42, '2026-04-10'),
  ('d1a00000-0000-0000-0000-000000000010', 'c1a00000-0000-0000-0000-000000000004', 'sms', 28, '2026-03-29');

-- Sarah
INSERT INTO public.checkin_schedule (order_id, user_id, channel, frequency_days, next_checkin_date) VALUES
  ('d1a00000-0000-0000-0000-000000000011', 'c1a00000-0000-0000-0000-000000000005', 'sms', 48, '2026-04-15'),
  ('d1a00000-0000-0000-0000-000000000012', 'c1a00000-0000-0000-0000-000000000005', 'sms', 28, '2026-03-31'),
  ('d1a00000-0000-0000-0000-000000000013', 'c1a00000-0000-0000-0000-000000000005', 'sms', 28, '2026-03-29');

-- David
INSERT INTO public.checkin_schedule (order_id, user_id, channel, frequency_days, next_checkin_date) VALUES
  ('d1a00000-0000-0000-0000-000000000014', 'c1a00000-0000-0000-0000-000000000006', 'sms', 40, '2026-04-11'),
  ('d1a00000-0000-0000-0000-000000000015', 'c1a00000-0000-0000-0000-000000000006', 'sms', 33, '2026-04-05');

-- ============================================
-- Delivery Schedule (upcoming + historical)
-- ============================================

-- Chloe — Faded Serum (history shows adaptation)
INSERT INTO public.delivery_schedule (order_id, user_id, scheduled_date, actual_date, action, days_adjusted, adjusted_by_checkin_id, savings_cents) VALUES
  ('d1a00000-0000-0000-0000-000000000001', 'c1a00000-0000-0000-0000-000000000001', '2026-01-14', NULL, 'skip', 30, 'e1a00000-0000-0000-0000-000000000001', 3600),
  ('d1a00000-0000-0000-0000-000000000001', 'c1a00000-0000-0000-0000-000000000001', '2026-02-13', '2026-02-25', 'delay', 12, 'e1a00000-0000-0000-0000-000000000002', 0),
  ('d1a00000-0000-0000-0000-000000000001', 'c1a00000-0000-0000-0000-000000000001', '2026-03-08', '2026-03-08', 'ship', 0, 'e1a00000-0000-0000-0000-000000000003', 0),
  ('d1a00000-0000-0000-0000-000000000001', 'c1a00000-0000-0000-0000-000000000001', '2026-04-08', NULL, 'skip', 30, 'e1a00000-0000-0000-0000-000000000004', 3600),
  ('d1a00000-0000-0000-0000-000000000001', 'c1a00000-0000-0000-0000-000000000001', '2026-05-08', NULL, 'ship', 0, NULL, 0);

-- Marcus — AG1 (history)
INSERT INTO public.delivery_schedule (order_id, user_id, scheduled_date, actual_date, action, days_adjusted, adjusted_by_checkin_id, savings_cents) VALUES
  ('d1a00000-0000-0000-0000-000000000007', 'c1a00000-0000-0000-0000-000000000004', '2026-01-04', '2026-01-12', 'delay', 8, 'e1a00000-0000-0000-0000-000000000009', 0),
  ('d1a00000-0000-0000-0000-000000000007', 'c1a00000-0000-0000-0000-000000000004', '2026-02-08', '2026-02-08', 'ship', 0, 'e1a00000-0000-0000-0000-000000000010', 0),
  ('d1a00000-0000-0000-0000-000000000007', 'c1a00000-0000-0000-0000-000000000004', '2026-03-08', '2026-03-16', 'delay', 8, 'e1a00000-0000-0000-0000-000000000011', 0),
  ('d1a00000-0000-0000-0000-000000000007', 'c1a00000-0000-0000-0000-000000000004', '2026-04-10', NULL, 'ship', 0, NULL, 0);

-- Marcus — DS-01
INSERT INTO public.delivery_schedule (order_id, user_id, scheduled_date, actual_date, action, days_adjusted, adjusted_by_checkin_id, savings_cents) VALUES
  ('d1a00000-0000-0000-0000-000000000008', 'c1a00000-0000-0000-0000-000000000004', '2026-01-19', NULL, 'skip', 30, 'e1a00000-0000-0000-0000-000000000012', 4999),
  ('d1a00000-0000-0000-0000-000000000008', 'c1a00000-0000-0000-0000-000000000004', '2026-02-18', '2026-02-24', 'delay', 6, 'e1a00000-0000-0000-0000-000000000013', 0),
  ('d1a00000-0000-0000-0000-000000000008', 'c1a00000-0000-0000-0000-000000000004', '2026-03-22', NULL, 'skip', 30, 'e1a00000-0000-0000-0000-000000000015', 4999),
  ('d1a00000-0000-0000-0000-000000000008', 'c1a00000-0000-0000-0000-000000000004', '2026-04-06', NULL, 'ship', 0, NULL, 0);

-- Sarah — Faded Serum (heavy skipper)
INSERT INTO public.delivery_schedule (order_id, user_id, scheduled_date, actual_date, action, days_adjusted, adjusted_by_checkin_id, savings_cents) VALUES
  ('d1a00000-0000-0000-0000-000000000011', 'c1a00000-0000-0000-0000-000000000005', '2026-01-04', NULL, 'skip', 30, 'e1a00000-0000-0000-0000-000000000018', 3600),
  ('d1a00000-0000-0000-0000-000000000011', 'c1a00000-0000-0000-0000-000000000005', '2026-02-03', NULL, 'skip', 30, 'e1a00000-0000-0000-0000-000000000019', 3600),
  ('d1a00000-0000-0000-0000-000000000011', 'c1a00000-0000-0000-0000-000000000005', '2026-03-05', '2026-03-10', 'delay', 5, 'e1a00000-0000-0000-0000-000000000020', 0),
  ('d1a00000-0000-0000-0000-000000000011', 'c1a00000-0000-0000-0000-000000000005', '2026-04-18', NULL, 'ship', 0, NULL, 0);

-- ============================================
-- Magic Links
-- ============================================
INSERT INTO public.magic_links (user_id, token) VALUES
  ('c1a00000-0000-0000-0000-000000000001', 'chloe-demo'),
  ('c1a00000-0000-0000-0000-000000000004', 'marcus-demo'),
  ('a1b00000-0000-0000-0000-000000000001', 'topicals-admin'),
  ('a1b00000-0000-0000-0000-000000000002', 'ag1-admin'),
  ('a1b00000-0000-0000-0000-000000000001', 'admin-demo');
