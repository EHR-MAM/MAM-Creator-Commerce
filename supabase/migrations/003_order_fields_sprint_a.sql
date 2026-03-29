-- Migration 003: Add full order fields for Sprint A
-- Adds customer contact, size/variant, special instructions, email fields to orders table
-- Run in Supabase SQL editor: https://app.supabase.com/project/pmkvzwgizpropwjgpopp/sql
-- Date: 2026-03-21

-- Add customer contact fields (were missing from original schema)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address VARCHAR(500);

-- Add order detail fields (Sprint A requirements)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS size_variant VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS special_instructions VARCHAR(1000);

-- Index for influencer order lookups (powers /orders/mine for influencers)
CREATE INDEX IF NOT EXISTS idx_orders_influencer_created
  ON orders (influencer_id, created_at DESC);

-- Index for status filtering in admin
CREATE INDEX IF NOT EXISTS idx_orders_status
  ON orders (status);
