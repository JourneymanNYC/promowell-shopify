-- =====================================================
-- SUPABASE MIGRATION: 001_initial_schema.sql
-- Shopify Promotion Analytics - Initial Schema
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Data retention helper function (12 months)
CREATE OR REPLACE FUNCTION generate_data_retention_date(ts TIMESTAMP WITH TIME ZONE)
RETURNS DATE AS $$
BEGIN
    RETURN (ts + INTERVAL '12 months')::DATE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- SHOPS TABLE
-- =====================================================

CREATE TABLE shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_domain TEXT UNIQUE NOT NULL,
    shop_name TEXT NOT NULL,
    access_token TEXT NOT NULL,
    scope TEXT[],
    is_active BOOLEAN DEFAULT true,
    plan_name TEXT,
    currency TEXT DEFAULT 'USD',
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- RAW SHOPIFY DATA TABLES
-- =====================================================

-- Raw orders from Shopify API
CREATE TABLE shopify_orders_raw (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    shopify_order_id BIGINT UNIQUE NOT NULL,
    raw_data JSONB NOT NULL,
    
    -- Key order fields (extracted for quick access)
    order_number TEXT,
    total_price DECIMAL(12,2),
    subtotal_price DECIMAL(12,2),
    total_tax DECIMAL(12,2),
    total_discounts DECIMAL(12,2),
    currency TEXT,
    financial_status TEXT,
    fulfillment_status TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Sales channel tracking
    channel_source_name TEXT,
    channel_app_id BIGINT,
    channel_app_name TEXT,
    channel_info JSONB DEFAULT '{}'::jsonb,
    
    -- Discount tracking
    discount_codes TEXT[],
    discount_applications JSONB,
    discount_allocations JSONB,
    automatic_discount_applications JSONB,
    manual_discount_applications JSONB,
    
    -- Timestamps & retention
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_retention_date DATE GENERATED ALWAYS AS (generate_data_retention_date(created_at)) STORED
);

-- Raw products from Shopify API
CREATE TABLE shopify_products_raw (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    shopify_product_id BIGINT UNIQUE NOT NULL,
    raw_data JSONB NOT NULL,
    
    -- Key product fields
    title TEXT,
    handle TEXT,
    product_type TEXT,
    vendor TEXT,
    status TEXT,
    
    -- Timestamps & retention
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_retention_date DATE GENERATED ALWAYS AS (generate_data_retention_date(created_at)) STORED
);

-- Raw discounts from Shopify API
CREATE TABLE shopify_discounts_raw (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    shopify_discount_id BIGINT UNIQUE NOT NULL,
    raw_data JSONB NOT NULL,
    
    -- Basic discount info
    code TEXT,
    title TEXT,
    summary TEXT,
    discount_class TEXT CHECK (discount_class IN ('product', 'order', 'shipping')),
    discount_type TEXT CHECK (discount_type IN ('basic_amount', 'basic_percentage', 'bxgy', 'free_shipping', 'automatic', 'app', 'fixed_amount', 'percentage')),
    is_automatic BOOLEAN DEFAULT false,
    status TEXT CHECK (status IN ('ACTIVE', 'EXPIRED', 'SCHEDULED', 'active', 'expired', 'scheduled', 'inactive')),
    
    -- Discount value
    value_type TEXT CHECK (value_type IN ('percentage', 'fixed_amount', 'free_shipping')),
    value_amount DECIMAL(12,2),
    value_percentage DECIMAL(5,2),
    
    -- Requirements & limits
    minimum_requirement TEXT,
    minimum_amount DECIMAL(12,2),
    usage_limit INTEGER,
    used_count INTEGER,
    async_usage_count INTEGER DEFAULT 0,
    applies_once_per_customer BOOLEAN DEFAULT false,
    applies_once BOOLEAN DEFAULT false,
    
    -- Dates
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    shopify_created_at TIMESTAMP WITH TIME ZONE,
    shopify_updated_at TIMESTAMP WITH TIME ZONE,
    
    -- Combinations
    combines_with_order_discounts BOOLEAN DEFAULT false,
    combines_with_product_discounts BOOLEAN DEFAULT false,
    combines_with_shipping_discounts BOOLEAN DEFAULT false,
    
    -- Targeting
    customer_selection TEXT CHECK (customer_selection IN ('all', 'prerequisite')),
    prerequisite_customers JSONB DEFAULT '[]',
    entitled_products JSONB DEFAULT '[]',
    entitled_collections JSONB DEFAULT '[]',
    entitled_countries JSONB DEFAULT '[]',
    entitled_variants JSONB DEFAULT '[]',
    
    -- Performance tracking
    total_sales DECIMAL(12,2) DEFAULT 0,
    codes_count INTEGER DEFAULT 0,
    
    -- Timestamps & retention
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_retention_date DATE GENERATED ALWAYS AS (generate_data_retention_date(created_at)) STORED
);

-- =====================================================
-- DISCOUNT PERFORMANCE DAILY TABLE
-- =====================================================

CREATE TABLE discount_performance_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    
    -- Discount identification
    discount_code TEXT,
    discount_id BIGINT,
    discount_title TEXT,
    discount_type TEXT,
    is_automatic BOOLEAN DEFAULT false,
    
    -- Date for daily aggregation
    date DATE NOT NULL,
    
    -- Order metrics
    orders_count INTEGER DEFAULT 0,
    total_orders_value DECIMAL(12,2) DEFAULT 0,
    average_order_value DECIMAL(12,2) DEFAULT 0,
    average_order_value_impact DECIMAL(12,2) DEFAULT 0,
    
    -- Discount metrics
    total_discount_expense DECIMAL(12,2) DEFAULT 0,
    average_discount_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Customer metrics
    unique_customers INTEGER DEFAULT 0,
    customer_acquisition INTEGER DEFAULT 0,
    new_customers INTEGER DEFAULT 0,
    returning_customers INTEGER DEFAULT 0,
    
    -- Revenue & profit impact
    revenue_impact DECIMAL(12,2) DEFAULT 0,
    profit_impact DECIMAL(12,2) DEFAULT 0,
    
    -- Conversion metrics
    conversion_rate DECIMAL(5,2),
    
    -- Channel breakdown
    channel_breakdown JSONB DEFAULT '{}'::jsonb,
    
    -- Time-based performance
    time_based_performance JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(shop_id, discount_code, date)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Shops indexes
CREATE INDEX idx_shops_domain ON shops(shop_domain);
CREATE INDEX idx_shops_active ON shops(is_active) WHERE is_active = true;

-- Orders raw indexes
CREATE INDEX idx_orders_raw_shop_date ON shopify_orders_raw(shop_id, created_at);
CREATE INDEX idx_orders_raw_retention ON shopify_orders_raw(data_retention_date);
CREATE INDEX idx_orders_raw_shopify_id ON shopify_orders_raw(shopify_order_id);
CREATE INDEX idx_orders_raw_channel_source ON shopify_orders_raw(channel_source_name);
CREATE INDEX idx_orders_raw_channel_app ON shopify_orders_raw(channel_app_id);
CREATE INDEX idx_orders_raw_discount_codes ON shopify_orders_raw USING GIN(discount_codes);
CREATE INDEX idx_orders_raw_discount_applications ON shopify_orders_raw USING GIN(discount_applications);

-- Products raw indexes
CREATE INDEX idx_products_raw_shop ON shopify_products_raw(shop_id);
CREATE INDEX idx_products_raw_shopify_id ON shopify_products_raw(shopify_product_id);
CREATE INDEX idx_products_raw_retention ON shopify_products_raw(data_retention_date);
CREATE INDEX idx_products_raw_status ON shopify_products_raw(status);

-- Discounts raw indexes
CREATE INDEX idx_discounts_raw_shop ON shopify_discounts_raw(shop_id);
CREATE INDEX idx_discounts_raw_shopify_id ON shopify_discounts_raw(shopify_discount_id);
CREATE INDEX idx_discounts_raw_code ON shopify_discounts_raw(code) WHERE code IS NOT NULL;
CREATE INDEX idx_discounts_raw_title ON shopify_discounts_raw(title) WHERE title IS NOT NULL;
CREATE INDEX idx_discounts_raw_status ON shopify_discounts_raw(status);
CREATE INDEX idx_discounts_raw_is_automatic ON shopify_discounts_raw(is_automatic);
CREATE INDEX idx_discounts_raw_discount_class ON shopify_discounts_raw(discount_class);
CREATE INDEX idx_discounts_raw_dates ON shopify_discounts_raw(starts_at, ends_at);
CREATE INDEX idx_discounts_raw_shop_status ON shopify_discounts_raw(shop_id, status);
CREATE INDEX idx_discounts_raw_retention ON shopify_discounts_raw(data_retention_date);
CREATE INDEX idx_discounts_raw_entitled_products ON shopify_discounts_raw USING GIN(entitled_products);
CREATE INDEX idx_discounts_raw_entitled_collections ON shopify_discounts_raw USING GIN(entitled_collections);

-- Discount performance daily indexes
CREATE INDEX idx_discount_perf_daily_shop_date ON discount_performance_daily(shop_id, date);
CREATE INDEX idx_discount_perf_daily_code ON discount_performance_daily(discount_code);
CREATE INDEX idx_discount_perf_daily_discount_id ON discount_performance_daily(discount_id);
CREATE INDEX idx_discount_perf_daily_type ON discount_performance_daily(discount_type);
CREATE INDEX idx_discount_perf_daily_is_automatic ON discount_performance_daily(is_automatic);
CREATE INDEX idx_discount_perf_daily_shop_code_date ON discount_performance_daily(shop_id, discount_code, date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_orders_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_products_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_discounts_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_performance_daily ENABLE ROW LEVEL SECURITY;

-- Helper function to get current shop domain from JWT
CREATE OR REPLACE FUNCTION get_current_shop_domain()
RETURNS TEXT AS $$
BEGIN
    RETURN current_setting('request.jwt.claims', true)::json->>'shop_domain';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get shop_id from domain
CREATE OR REPLACE FUNCTION get_shop_id_from_domain(domain TEXT)
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT id FROM shops WHERE shop_domain = domain LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for shops table
CREATE POLICY "Users can view their own shop" ON shops
    FOR SELECT USING (shop_domain = get_current_shop_domain());

CREATE POLICY "Users can update their own shop" ON shops
    FOR UPDATE USING (shop_domain = get_current_shop_domain());

-- RLS Policies for raw data tables
CREATE POLICY "Shop can access own raw orders" ON shopify_orders_raw
    FOR ALL USING (shop_id = get_shop_id_from_domain(get_current_shop_domain()));

CREATE POLICY "Shop can access own raw products" ON shopify_products_raw
    FOR ALL USING (shop_id = get_shop_id_from_domain(get_current_shop_domain()));

CREATE POLICY "Shop can access own raw discounts" ON shopify_discounts_raw
    FOR ALL USING (shop_id = get_shop_id_from_domain(get_current_shop_domain()));

-- RLS Policies for performance table
CREATE POLICY "Shop can access own discount performance" ON discount_performance_daily
    FOR ALL USING (shop_id = get_shop_id_from_domain(get_current_shop_domain()));

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE shops IS 'Stores Shopify shop information and authentication';
COMMENT ON TABLE shopify_orders_raw IS 'Raw order data from Shopify API with 12-month retention';
COMMENT ON TABLE shopify_products_raw IS 'Raw product data from Shopify API with 12-month retention';
COMMENT ON TABLE shopify_discounts_raw IS 'Raw discount/promotion data from Shopify API with 12-month retention';
COMMENT ON TABLE discount_performance_daily IS 'Daily aggregated performance metrics for each promotion';

COMMENT ON COLUMN shopify_orders_raw.channel_source_name IS 'Sales channel source (e.g., web, pos, api)';
COMMENT ON COLUMN shopify_orders_raw.discount_applications IS 'Array of discount applications from Shopify';
COMMENT ON COLUMN shopify_discounts_raw.discount_class IS 'Type of discount: product, order, or shipping';
COMMENT ON COLUMN shopify_discounts_raw.is_automatic IS 'True if automatic discount (no code required)';
COMMENT ON COLUMN discount_performance_daily.date IS 'Date for daily aggregation of metrics';
COMMENT ON COLUMN discount_performance_daily.average_order_value_impact IS 'Change in AOV attributed to this discount';
COMMENT ON COLUMN discount_performance_daily.customer_acquisition IS 'Number of customers acquired through this discount';
COMMENT ON COLUMN discount_performance_daily.channel_breakdown IS 'Performance breakdown by sales channel';
COMMENT ON COLUMN discount_performance_daily.time_based_performance IS 'Performance breakdown by time periods (hourly, day-of-week, etc.)';