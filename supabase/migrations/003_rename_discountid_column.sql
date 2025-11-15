-- =====================================================
-- SUPABASE MIGRATION: 003_rename_discountid_column.sql
-- Rename discount_id to shopify_discount_id in shopify_orders_raw
-- =====================================================

-- Rename column in shopify_orders_raw table
ALTER TABLE shopify_orders_raw
RENAME COLUMN discount_id TO shopify_discount_id;

-- Update index name to reflect new column name
ALTER INDEX idx_orders_raw_discount_id
RENAME TO idx_orders_raw_shopify_discount_id;