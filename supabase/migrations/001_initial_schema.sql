-- EHR Creator Commerce Platform
-- Migration 001: Initial Schema
-- Apply via: Supabase SQL Editor or supabase db push

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================
-- ENUMS
-- ========================
CREATE TYPE user_role AS ENUM ('admin', 'influencer', 'vendor', 'customer', 'operator');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE influencer_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE vendor_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE product_status AS ENUM ('active', 'inactive', 'out_of_stock');
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'ended');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE payment_status AS ENUM ('unpaid', 'pending', 'paid', 'refunded');
CREATE TYPE fulfillment_status AS ENUM ('unfulfilled', 'processing', 'shipped', 'delivered', 'failed');
CREATE TYPE commission_status AS ENUM ('pending', 'payable', 'paid', 'reversed');
CREATE TYPE payment_provider_status AS ENUM ('initiated', 'pending', 'success', 'failed', 'refunded');
CREATE TYPE payee_type AS ENUM ('influencer', 'platform');
CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'escalated');

-- ========================
-- USERS
-- ========================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role user_role NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    hashed_password VARCHAR(255) NOT NULL,
    status user_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ========================
-- INFLUENCERS
-- ========================
CREATE TABLE influencers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    handle VARCHAR(100) NOT NULL,
    platform_name VARCHAR(50) NOT NULL DEFAULT 'tiktok',
    audience_region VARCHAR(100) DEFAULT 'Ghana',
    payout_method VARCHAR(50),
    payout_details_ref VARCHAR(255),
    status influencer_status NOT NULL DEFAULT 'active'
);

-- ========================
-- VENDORS
-- ========================
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    business_name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50),
    fulfillment_sla_hours INTEGER NOT NULL DEFAULT 72,
    status vendor_status NOT NULL DEFAULT 'active'
);

-- ========================
-- PRODUCTS
-- ========================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    color VARCHAR(50),
    size VARCHAR(50),
    price NUMERIC(10,2) NOT NULL,
    cost_basis NUMERIC(10,2),
    currency VARCHAR(3) NOT NULL DEFAULT 'GHS',
    inventory_count INTEGER NOT NULL DEFAULT 0,
    status product_status NOT NULL DEFAULT 'active',
    media_urls JSONB,
    metadata_json JSONB
);
CREATE INDEX idx_products_vendor_status ON products(vendor_id, status);
CREATE INDEX idx_products_category ON products(category);

-- ========================
-- CAMPAIGNS
-- ========================
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    influencer_id UUID NOT NULL REFERENCES influencers(id),
    name VARCHAR(255) NOT NULL,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    status campaign_status NOT NULL DEFAULT 'draft',
    attribution_rules_json JSONB
);

CREATE TABLE product_campaign_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id),
    product_id UUID NOT NULL REFERENCES products(id),
    featured_rank INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE
);

-- ========================
-- ORDERS
-- ========================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES users(id),
    influencer_id UUID REFERENCES influencers(id),
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    campaign_id UUID REFERENCES campaigns(id),
    status order_status NOT NULL DEFAULT 'pending',
    subtotal NUMERIC(10,2) NOT NULL,
    delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
    total NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'GHS',
    payment_status payment_status NOT NULL DEFAULT 'unpaid',
    fulfillment_status fulfillment_status NOT NULL DEFAULT 'unfulfilled',
    source_channel VARCHAR(50) DEFAULT 'tiktok',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_orders_influencer_created ON orders(influencer_id, created_at);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_vendor ON orders(vendor_id);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id),
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    line_total NUMERIC(10,2) NOT NULL
);

-- ========================
-- PAYOUTS (before commissions — FK dependency)
-- ========================
CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payee_type payee_type NOT NULL,
    payee_id UUID NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'GHS',
    status payout_status NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50),
    external_reference VARCHAR(255),
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ
);

-- ========================
-- COMMISSIONS
-- ========================
CREATE TABLE commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL UNIQUE REFERENCES orders(id),
    influencer_amount NUMERIC(10,2) NOT NULL,
    platform_amount NUMERIC(10,2) NOT NULL,
    vendor_amount NUMERIC(10,2) NOT NULL,
    commission_status commission_status NOT NULL DEFAULT 'pending',
    payout_batch_id UUID REFERENCES payouts(id),
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_commissions_status ON commissions(commission_status, calculated_at);

-- ========================
-- PAYMENTS
-- ========================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id),
    provider VARCHAR(50) NOT NULL,
    provider_reference VARCHAR(255) UNIQUE,
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'GHS',
    status payment_provider_status NOT NULL DEFAULT 'initiated',
    raw_payload_json JSONB
);

-- ========================
-- ANALYTICS EVENTS
-- ========================
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_type VARCHAR(50),
    actor_id UUID,
    event_name VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    payload_json JSONB,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_analytics_event_name ON analytics_events(event_name, occurred_at);

-- ========================
-- SUPPORT TICKETS
-- ========================
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id),
    customer_id UUID REFERENCES users(id),
    issue_type VARCHAR(100) NOT NULL,
    status ticket_status NOT NULL DEFAULT 'open',
    owner_id UUID REFERENCES users(id),
    resolution_notes TEXT
);

-- ========================
-- AUTO-UPDATE updated_at
-- ========================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
