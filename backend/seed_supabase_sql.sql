-- EHR Creator Commerce Platform — Pilot Seed Data
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/pmkvzwgizpropwjgpopp/sql

-- Admin: David Bezar
INSERT INTO users (id, role, name, email, hashed_password, status)
VALUES (
  gen_random_uuid(), 'admin', 'David Bezar', 'airatpack@gmail.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdQBd6tY1qkOu',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- Christiana: influencer user + influencer record
DO $$
DECLARE
  c_user_id UUID := gen_random_uuid();
  c_inf_id  UUID := gen_random_uuid();
  v1_user   UUID := gen_random_uuid();
  v1_id     UUID := gen_random_uuid();
  v2_user   UUID := gen_random_uuid();
  v2_id     UUID := gen_random_uuid();
  v3_user   UUID := gen_random_uuid();
  v3_id     UUID := gen_random_uuid();
  p1  UUID := gen_random_uuid();
  p2  UUID := gen_random_uuid();
  p3  UUID := gen_random_uuid();
  p4  UUID := gen_random_uuid();
  p5  UUID := gen_random_uuid();
  p6  UUID := gen_random_uuid();
  p7  UUID := gen_random_uuid();
  p8  UUID := gen_random_uuid();
  p9  UUID := gen_random_uuid();
  p10 UUID := gen_random_uuid();
  p11 UUID := gen_random_uuid();
  p12 UUID := gen_random_uuid();
  camp_id UUID := gen_random_uuid();
BEGIN

  -- Christiana user
  INSERT INTO users (id, role, name, email, hashed_password, status)
  VALUES (c_user_id, 'influencer', 'Christiana Amankwaah', 'uchik9935@gmail.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdQBd6tY1qkOu', 'active')
  ON CONFLICT (email) DO NOTHING;

  -- Get actual user id in case of conflict
  SELECT id INTO c_user_id FROM users WHERE email = 'uchik9935@gmail.com';

  INSERT INTO influencers (id, user_id, handle, platform_name, audience_region, payout_method, status)
  VALUES (c_inf_id, c_user_id, 'sweet200723', 'tiktok', 'Ghana', 'momo', 'active');

  -- Vendor 1: Fashion
  INSERT INTO users (id, role, name, email, hashed_password, status)
  VALUES (v1_user, 'vendor', 'Accra Style Hub', 'accastylehub@placeholder.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdQBd6tY1qkOu', 'active');
  INSERT INTO vendors (id, user_id, business_name, location, contact_phone, fulfillment_sla_hours, status)
  VALUES (v1_id, v1_user, 'Accra Style Hub', 'East Legon, Accra', '+233200000001', 48, 'active');

  -- Vendor 2: Hair
  INSERT INTO users (id, role, name, email, hashed_password, status)
  VALUES (v2_user, 'vendor', 'Ghana Wig Queen', 'ghanawigsqueen@placeholder.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdQBd6tY1qkOu', 'active');
  INSERT INTO vendors (id, user_id, business_name, location, contact_phone, fulfillment_sla_hours, status)
  VALUES (v2_id, v2_user, 'Ghana Wig Queen', 'Spintex Road, Accra', '+233200000002', 72, 'active');

  -- Vendor 3: Accessories
  INSERT INTO users (id, role, name, email, hashed_password, status)
  VALUES (v3_user, 'vendor', 'Gold Coast Accessories', 'goldcoastacc@placeholder.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdQBd6tY1qkOu', 'active');
  INSERT INTO vendors (id, user_id, business_name, location, contact_phone, fulfillment_sla_hours, status)
  VALUES (v3_id, v3_user, 'Gold Coast Accessories', 'Osu, Accra', '+233200000003', 48, 'active');

  -- Products: Fashion (v1)
  INSERT INTO products (id,vendor_id,sku,name,category,color,price,currency,inventory_count,status) VALUES
    (p1, v1_id,'FASH-001','Ankara Wrap Dress','fashion','blue/gold',180.00,'GHS',15,'active'),
    (p2, v1_id,'FASH-002','Kente Coord Set','fashion','multicolor',220.00,'GHS',10,'active'),
    (p3, v1_id,'FASH-003','Lace Bodycon Dress','fashion','black',150.00,'GHS',20,'active'),
    (p4, v1_id,'FASH-004','Puff Sleeve Blouse','fashion','white',95.00,'GHS',25,'active'),
    (p5, v1_id,'FASH-005','High-Waist Ankara Skirt','fashion','green/orange',120.00,'GHS',18,'active');

  -- Products: Hair (v2)
  INSERT INTO products (id,vendor_id,sku,name,category,color,price,currency,inventory_count,status) VALUES
    (p6, v2_id,'HAIR-001','Body Wave Wig 18in','hair','natural black',380.00,'GHS',8,'active'),
    (p7, v2_id,'HAIR-002','Straight Lace Front Wig 20in','hair','natural black',420.00,'GHS',6,'active'),
    (p8, v2_id,'HAIR-003','Curly Bob Wig 12in','hair','dark brown',280.00,'GHS',12,'active');

  -- Products: Accessories (v3)
  INSERT INTO products (id,vendor_id,sku,name,category,color,price,currency,inventory_count,status) VALUES
    (p9,  v3_id,'ACC-001','Gold Cowrie Statement Necklace','accessories','gold',65.00,'GHS',30,'active'),
    (p10, v3_id,'ACC-002','Beaded Waist Beads Set','accessories','multicolor',45.00,'GHS',50,'active'),
    (p11, v3_id,'ACC-003','Straw Tote Bag','accessories','natural',85.00,'GHS',20,'active'),
    (p12, v3_id,'ACC-004','Kente Print Bucket Hat','accessories','multicolor',55.00,'GHS',25,'active');

  -- Campaign
  INSERT INTO campaigns (id, influencer_id, name, status, attribution_rules_json)
  VALUES (camp_id, c_inf_id, 'Christiana Ghana Pilot 2025', 'active',
    '{"window_hours": 72, "last_click": true}'::jsonb);

  -- Link all products to campaign
  INSERT INTO product_campaign_links (id, campaign_id, product_id, featured_rank, active) VALUES
    (gen_random_uuid(), camp_id, p1,  0, true),
    (gen_random_uuid(), camp_id, p2,  1, true),
    (gen_random_uuid(), camp_id, p3,  2, true),
    (gen_random_uuid(), camp_id, p4,  3, true),
    (gen_random_uuid(), camp_id, p5,  4, true),
    (gen_random_uuid(), camp_id, p6,  5, true),
    (gen_random_uuid(), camp_id, p7,  6, true),
    (gen_random_uuid(), camp_id, p8,  7, true),
    (gen_random_uuid(), camp_id, p9,  8, true),
    (gen_random_uuid(), camp_id, p10, 9, true),
    (gen_random_uuid(), camp_id, p11, 10, true),
    (gen_random_uuid(), camp_id, p12, 11, true);

  RAISE NOTICE 'SEED COMPLETE';
  RAISE NOTICE 'Christiana influencer ID: %', c_inf_id;
  RAISE NOTICE 'Campaign ID: %', camp_id;
  RAISE NOTICE 'All passwords hash to: ChangeMe2025!';

END $$;

-- Verify
SELECT 'users' as tbl, count(*) FROM users
UNION ALL SELECT 'influencers', count(*) FROM influencers
UNION ALL SELECT 'vendors', count(*) FROM vendors
UNION ALL SELECT 'products', count(*) FROM products
UNION ALL SELECT 'campaigns', count(*) FROM campaigns
UNION ALL SELECT 'product_campaign_links', count(*) FROM product_campaign_links;
