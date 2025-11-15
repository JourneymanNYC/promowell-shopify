-- =====================================================
-- SUPABASE MIGRATION: 002_add_columns_and_rename.sql
-- Add quantity and discount_id to shopify_orders_raw
-- Rename revenue_impact/profit_impact to revenue_uplift/profit_uplift
-- =====================================================

-- Add columns to shopify_orders_raw table
ALTER TABLE shopify_orders_raw
ADD COLUMN quantity INTEGER,
ADD COLUMN discount_id UUID;

-- Create index on discount_id for performance
CREATE INDEX idx_orders_raw_discount_id ON shopify_orders_raw(discount_id);

-- Rename columns in discount_performance_daily table
ALTER TABLE discount_performance_daily
RENAME COLUMN revenue_impact TO revenue_uplift;

ALTER TABLE discount_performance_daily
RENAME COLUMN profit_impact TO profit_uplift;

-- Add comments for new columns
COMMENT ON COLUMN shopify_orders_raw.quantity IS 'Quantity of items in the order';
COMMENT ON COLUMN shopify_orders_raw.discount_id IS 'UUID reference to the associated discount';
COMMENT ON COLUMN discount_performance_daily.revenue_uplift IS 'Revenue uplift attributed to this discount';
COMMENT ON COLUMN discount_performance_daily.profit_uplift IS 'Profit uplift attributed to this discount';
