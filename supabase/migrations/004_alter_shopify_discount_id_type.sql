-- =====================================================
-- SUPABASE MIGRATION: 003_alter_shopify_discount_id_type.sql
-- Change shopify_discount_id column type from UUID to BIGINT
-- =====================================================

-- Drop the existing index first
DROP INDEX IF EXISTS idx_orders_raw_shopify_discount_id;

-- Alter the column type to BIGINT to match shopify_discounts_raw table
ALTER TABLE shopify_orders_raw
ALTER COLUMN shopify_discount_id TYPE BIGINT USING shopify_discount_id::text::bigint;

-- Recreate the index
CREATE INDEX idx_orders_raw_shopify_discount_id ON shopify_orders_raw(shopify_discount_id);

-- Update the comment
COMMENT ON COLUMN shopify_orders_raw.shopify_discount_id IS 'Shopify discount ID from Shopify API (matches shopify_discount_id in shopify_discounts_raw)';
