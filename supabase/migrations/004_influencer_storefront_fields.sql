-- Migration 004: Influencer storefront customisation fields (Sprint B)
-- Adds template_id, bio, avatar_url to influencers table
-- Run in Supabase SQL editor: https://app.supabase.com/project/pmkvzwgizpropwjgpopp/sql
-- Date: 2026-03-21

ALTER TABLE influencers ADD COLUMN IF NOT EXISTS template_id VARCHAR(50) DEFAULT 'glow';
ALTER TABLE influencers ADD COLUMN IF NOT EXISTS bio VARCHAR(500);
ALTER TABLE influencers ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
