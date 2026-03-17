-- Migration 002: Tracking links for TikTok / social attribution
-- Run in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- Project: pmkvzwgizpropwjgpopp (EHR Creator Commerce Platform)

CREATE TABLE IF NOT EXISTS tracking_links (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        VARCHAR(20) UNIQUE NOT NULL,
    influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
    campaign_id   UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    label         VARCHAR(200),
    destination_path VARCHAR(500) NOT NULL DEFAULT '/',
    click_count   INTEGER NOT NULL DEFAULT 0,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tracking_links_code ON tracking_links(code);
CREATE INDEX IF NOT EXISTS idx_tracking_links_influencer ON tracking_links(influencer_id);
CREATE INDEX IF NOT EXISTS idx_tracking_links_active ON tracking_links(is_active);

-- Enable RLS
ALTER TABLE tracking_links ENABLE ROW LEVEL SECURITY;

-- Admins/operators see all
CREATE POLICY "admin_all_tracking_links" ON tracking_links
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
              AND users.role IN ('admin', 'operator')
        )
    );

-- Influencer sees and manages their own links
CREATE POLICY "influencer_own_tracking_links" ON tracking_links
    FOR ALL TO authenticated
    USING (
        influencer_id IN (
            SELECT id FROM influencers WHERE user_id = auth.uid()
        )
    );

-- Public can read active links (for redirect endpoint)
CREATE POLICY "public_read_active_links" ON tracking_links
    FOR SELECT TO anon
    USING (is_active = TRUE);
