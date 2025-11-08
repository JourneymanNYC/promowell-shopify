// Supabase database types for Shopify Promotion Analytics
export interface Database {
  public: {
    Tables: {
      shops: {
        Row: {
          id: string
          shop_domain: string
          shop_name: string
          access_token: string
          scope: string[]
          is_active: boolean
          plan_name: string | null
          currency: string
          timezone: string
          created_at: string
          updated_at: string
          last_sync_at: string | null
          settings: any
          model_storage_path: string | null
          last_model_training_at: string | null
        }
        Insert: {
          id?: string
          shop_domain: string
          shop_name: string
          access_token: string
          scope?: string[]
          is_active?: boolean
          plan_name?: string | null
          currency?: string
          timezone?: string
          created_at?: string
          updated_at?: string
          last_sync_at?: string | null
          settings?: any
          model_storage_path?: string | null
          last_model_training_at?: string | null
        }
        Update: {
          id?: string
          shop_domain?: string
          shop_name?: string
          access_token?: string
          scope?: string[]
          is_active?: boolean
          plan_name?: string | null
          currency?: string
          timezone?: string
          created_at?: string
          updated_at?: string
          last_sync_at?: string | null
          settings?: any
          model_storage_path?: string | null
          last_model_training_at?: string | null
        }
      }
      
      shopify_orders_raw: {
        Row: {
          id: string
          shop_id: string
          shopify_order_id: number
          raw_data: any
          order_number: string | null
          total_price: number | null
          subtotal_price: number | null
          total_tax: number | null
          total_discounts: number | null
          currency: string | null
          financial_status: string | null
          fulfillment_status: string | null
          processed_at: string | null
          created_at: string
          updated_at: string
          data_retention_date: string
        }
        Insert: {
          id?: string
          shop_id: string
          shopify_order_id: number
          raw_data: any
          order_number?: string | null
          total_price?: number | null
          subtotal_price?: number | null
          total_tax?: number | null
          total_discounts?: number | null
          currency?: string | null
          financial_status?: string | null
          fulfillment_status?: string | null
          processed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          shopify_order_id?: number
          raw_data?: any
          order_number?: string | null
          total_price?: number | null
          subtotal_price?: number | null
          total_tax?: number | null
          total_discounts?: number | null
          currency?: string | null
          financial_status?: string | null
          fulfillment_status?: string | null
          processed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      shopify_products_raw: {
        Row: {
          id: string
          shop_id: string
          shopify_product_id: number
          raw_data: any
          title: string | null
          handle: string | null
          product_type: string | null
          vendor: string | null
          status: string | null
          created_at: string
          updated_at: string
          data_retention_date: string
        }
        Insert: {
          id?: string
          shop_id: string
          shopify_product_id: number
          raw_data: any
          title?: string | null
          handle?: string | null
          product_type?: string | null
          vendor?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          shopify_product_id?: number
          raw_data?: any
          title?: string | null
          handle?: string | null
          product_type?: string | null
          vendor?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      shopify_variants_raw: {
        Row: {
          id: string
          product_id: string
          shopify_variant_id: number
          raw_data: any
          title: string | null
          sku: string | null
          price: number | null
          compare_at_price: number | null
          cost_price: number | null
          weight: number | null
          weight_unit: string | null
          inventory_quantity: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          shopify_variant_id: number
          raw_data: any
          title?: string | null
          sku?: string | null
          price?: number | null
          compare_at_price?: number | null
          cost_price?: number | null
          weight?: number | null
          weight_unit?: string | null
          inventory_quantity?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          shopify_variant_id?: number
          raw_data?: any
          title?: string | null
          sku?: string | null
          price?: number | null
          compare_at_price?: number | null
          cost_price?: number | null
          weight?: number | null
          weight_unit?: string | null
          inventory_quantity?: number | null
          created_at?: string
          updated_at?: string
        }
      }

      shopify_customers_raw: {
        Row: {
          id: string
          shop_id: string
          shopify_customer_id: number
          raw_data: any
          email: string | null
          first_name: string | null
          last_name: string | null
          phone: string | null
          total_spent: number | null
          orders_count: number | null
          state: string | null
          created_at: string
          updated_at: string
          data_retention_date: string
        }
        Insert: {
          id?: string
          shop_id: string
          shopify_customer_id: number
          raw_data: any
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          total_spent?: number | null
          orders_count?: number | null
          state?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          shopify_customer_id?: number
          raw_data?: any
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          total_spent?: number | null
          orders_count?: number | null
          state?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      shopify_discounts_raw: {
        Row: {
          id: string
          shop_id: string
          shopify_discount_id: number
          raw_data: any
          code: string | null
          amount: number | null
          percentage: number | null
          discount_type: string | null
          minimum_requirement: string | null
          minimum_amount: number | null
          usage_limit: number | null
          used_count: number | null
          starts_at: string | null
          ends_at: string | null
          status: string | null
          created_at: string
          updated_at: string
          data_retention_date: string
        }
        Insert: {
          id?: string
          shop_id: string
          shopify_discount_id: number
          raw_data: any
          code?: string | null
          amount?: number | null
          percentage?: number | null
          discount_type?: string | null
          minimum_requirement?: string | null
          minimum_amount?: number | null
          usage_limit?: number | null
          used_count?: number | null
          starts_at?: string | null
          ends_at?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          shopify_discount_id?: number
          raw_data?: any
          code?: string | null
          amount?: number | null
          percentage?: number | null
          discount_type?: string | null
          minimum_requirement?: string | null
          minimum_amount?: number | null
          usage_limit?: number | null
          used_count?: number | null
          starts_at?: string | null
          ends_at?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      orders_processed: {
        Row: {
          id: string
          shop_id: string
          shopify_order_id: number
          order_number: string
          customer_id: number | null
          order_date: string
          total_revenue: number
          subtotal_revenue: number
          total_discount_amount: number
          total_tax: number
          total_shipping: number
          processing_fees: number
          net_revenue: number
          currency: string
          financial_status: string | null
          fulfillment_status: string | null
          discount_codes: string[]
          line_items_count: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          shopify_order_id: number
          order_number: string
          customer_id?: number | null
          order_date: string
          total_revenue: number
          subtotal_revenue: number
          total_discount_amount?: number
          total_tax?: number
          total_shipping?: number
          processing_fees?: number
          net_revenue: number
          currency: string
          financial_status?: string | null
          fulfillment_status?: string | null
          discount_codes?: string[]
          line_items_count?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          shopify_order_id?: number
          order_number?: string
          customer_id?: number | null
          order_date?: string
          total_revenue?: number
          subtotal_revenue?: number
          total_discount_amount?: number
          total_tax?: number
          total_shipping?: number
          processing_fees?: number
          net_revenue?: number
          currency?: string
          financial_status?: string | null
          fulfillment_status?: string | null
          discount_codes?: string[]
          line_items_count?: number | null
          created_at?: string
          updated_at?: string
        }
      }

      order_line_items_processed: {
        Row: {
          id: string
          order_id: string
          shop_id: string
          variant_id: number | null
          product_title: string | null
          variant_title: string | null
          sku: string | null
          quantity: number
          unit_price: number
          total_price: number
          unit_cost: number | null
          total_cost: number | null
          unit_discount: number
          total_discount: number
          unit_profit: number | null
          total_profit: number | null
          profit_margin: number | null
          discount_codes: string[]
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          shop_id: string
          variant_id?: number | null
          product_title?: string | null
          variant_title?: string | null
          sku?: string | null
          quantity: number
          unit_price: number
          total_price: number
          unit_cost?: number | null
          total_cost?: number | null
          unit_discount?: number
          total_discount?: number
          unit_profit?: number | null
          total_profit?: number | null
          profit_margin?: number | null
          discount_codes?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          shop_id?: string
          variant_id?: number | null
          product_title?: string | null
          variant_title?: string | null
          sku?: string | null
          quantity?: number
          unit_price?: number
          total_price?: number
          unit_cost?: number | null
          total_cost?: number | null
          unit_discount?: number
          total_discount?: number
          unit_profit?: number | null
          total_profit?: number | null
          profit_margin?: number | null
          discount_codes?: string[]
          created_at?: string
        }
      }

      discount_performance: {
        Row: {
          id: string
          shop_id: string
          discount_code: string
          discount_id: number | null
          date: string
          orders_count: number
          total_orders_value: number
          total_discount_amount: number
          average_order_value: number
          unique_customers: number
          revenue_impact: number
          profit_impact: number
          conversion_rate: number | null
          created_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          discount_code: string
          discount_id?: number | null
          date: string
          orders_count?: number
          total_orders_value?: number
          total_discount_amount?: number
          average_order_value?: number
          unique_customers?: number
          revenue_impact?: number
          profit_impact?: number
          conversion_rate?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          discount_code?: string
          discount_id?: number | null
          date?: string
          orders_count?: number
          total_orders_value?: number
          total_discount_amount?: number
          average_order_value?: number
          unique_customers?: number
          revenue_impact?: number
          profit_impact?: number
          conversion_rate?: number | null
          created_at?: string
        }
      }

      product_performance: {
        Row: {
          id: string
          shop_id: string
          product_id: number
          variant_id: number | null
          sku: string | null
          date: string
          orders_count: number
          quantity_sold: number
          total_revenue: number
          total_cost: number
          total_profit: number
          profit_margin: number | null
          average_selling_price: number | null
          discount_orders_count: number
          discount_revenue: number
          created_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          product_id: number
          variant_id?: number | null
          sku?: string | null
          date: string
          orders_count?: number
          quantity_sold?: number
          total_revenue?: number
          total_cost?: number
          total_profit?: number
          profit_margin?: number | null
          average_selling_price?: number | null
          discount_orders_count?: number
          discount_revenue?: number
          created_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          product_id?: number
          variant_id?: number | null
          sku?: string | null
          date?: string
          orders_count?: number
          quantity_sold?: number
          total_revenue?: number
          total_cost?: number
          total_profit?: number
          profit_margin?: number | null
          average_selling_price?: number | null
          discount_orders_count?: number
          discount_revenue?: number
          created_at?: string
        }
      }

      customer_analytics: {
        Row: {
          id: string
          shop_id: string
          customer_id: number
          email: string | null
          date: string
          orders_count: number
          total_spent: number
          average_order_value: number
          discount_orders_count: number
          discount_savings: number
          lifetime_value: number | null
          created_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          customer_id: number
          email?: string | null
          date: string
          orders_count?: number
          total_spent?: number
          average_order_value?: number
          discount_orders_count?: number
          discount_savings?: number
          lifetime_value?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          customer_id?: number
          email?: string | null
          date?: string
          orders_count?: number
          total_spent?: number
          average_order_value?: number
          discount_orders_count?: number
          discount_savings?: number
          lifetime_value?: number | null
          created_at?: string
        }
      }

      ml_models: {
        Row: {
          id: string
          shop_id: string
          model_type: string
          model_name: string
          version: string
          status: string
          model_storage_path: string | null
          model_metadata: any | null
          training_data_range_start: string | null
          training_data_range_end: string | null
          accuracy_metrics: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          model_type: string
          model_name: string
          version: string
          status?: string
          model_storage_path?: string | null
          model_metadata?: any | null
          training_data_range_start?: string | null
          training_data_range_end?: string | null
          accuracy_metrics?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          model_type?: string
          model_name?: string
          version?: string
          status?: string
          model_storage_path?: string | null
          model_metadata?: any | null
          training_data_range_start?: string | null
          training_data_range_end?: string | null
          accuracy_metrics?: any | null
          created_at?: string
          updated_at?: string
        }
      }

      promotion_recommendations: {
        Row: {
          id: string
          shop_id: string
          model_id: string
          recommendation_type: string
          target_product_ids: number[] | null
          target_customer_segments: string[] | null
          recommended_discount_type: string | null
          recommended_discount_value: number | null
          expected_revenue_impact: number | null
          expected_profit_impact: number | null
          confidence_score: number | null
          reasoning: string | null
          status: string
          valid_until: string | null
          created_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          model_id: string
          recommendation_type: string
          target_product_ids?: number[] | null
          target_customer_segments?: string[] | null
          recommended_discount_type?: string | null
          recommended_discount_value?: number | null
          expected_revenue_impact?: number | null
          expected_profit_impact?: number | null
          confidence_score?: number | null
          reasoning?: string | null
          status?: string
          valid_until?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          model_id?: string
          recommendation_type?: string
          target_product_ids?: number[] | null
          target_customer_segments?: string[] | null
          recommended_discount_type?: string | null
          recommended_discount_value?: number | null
          expected_revenue_impact?: number | null
          expected_profit_impact?: number | null
          confidence_score?: number | null
          reasoning?: string | null
          status?: string
          valid_until?: string | null
          created_at?: string
        }
      }

      trend_alerts: {
        Row: {
          id: string
          shop_id: string
          model_id: string
          alert_type: string
          entity_type: string
          entity_id: string
          severity: string
          title: string
          description: string
          metrics: any | null
          threshold_value: number | null
          current_value: number | null
          trend_direction: string | null
          confidence_score: number | null
          status: string
          acknowledged_at: string | null
          resolved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          model_id: string
          alert_type: string
          entity_type: string
          entity_id: string
          severity: string
          title: string
          description: string
          metrics?: any | null
          threshold_value?: number | null
          current_value?: number | null
          trend_direction?: string | null
          confidence_score?: number | null
          status?: string
          acknowledged_at?: string | null
          resolved_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          model_id?: string
          alert_type?: string
          entity_type?: string
          entity_id?: string
          severity?: string
          title?: string
          description?: string
          metrics?: any | null
          threshold_value?: number | null
          current_value?: number | null
          trend_direction?: string | null
          confidence_score?: number | null
          status?: string
          acknowledged_at?: string | null
          resolved_at?: string | null
          created_at?: string
        }
      }

      etl_jobs: {
        Row: {
          id: string
          shop_id: string
          job_type: string
          status: string
          data_type: string
          records_processed: number
          records_failed: number
          started_at: string | null
          completed_at: string | null
          error_message: string | null
          metadata: any | null
          created_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          job_type: string
          status?: string
          data_type: string
          records_processed?: number
          records_failed?: number
          started_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          metadata?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          job_type?: string
          status?: string
          data_type?: string
          records_processed?: number
          records_failed?: number
          started_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          metadata?: any | null
          created_at?: string
        }
      }

      sync_status: {
        Row: {
          id: string
          shop_id: string
          data_type: string
          last_sync_at: string | null
          last_sync_id: string | null
          sync_status: string
          records_count: number | null
        }
        Insert: {
          id?: string
          shop_id: string
          data_type: string
          last_sync_at?: string | null
          last_sync_id?: string | null
          sync_status?: string
          records_count?: number | null
        }
        Update: {
          id?: string
          shop_id?: string
          data_type?: string
          last_sync_at?: string | null
          last_sync_id?: string | null
          sync_status?: string
          records_count?: number | null
        }
      }
    }
    
    Views: {
      dashboard_summary: {
        Row: {
          shop_id: string
          shop_domain: string
          shop_name: string
          total_orders: number
          total_revenue: number
          total_discounts: number
          net_revenue: number
          active_discounts: number
          last_sync_at: string | null
        }
      }
      
      top_discounts: {
        Row: {
          shop_id: string
          discount_code: string
          total_orders: number
          total_revenue: number
          total_discounts: number
          avg_order_value: number
          days_active: number
        }
      }

      data_retention_monitor: {
        Row: {
          table_name: string
          total_records: number
          expired_records: number
          expiring_soon: number
          oldest_record: string | null
          newest_record: string | null
        }
      }
    }
    
    Functions: {
      calculate_discount_performance: {
        Args: {
          p_shop_id: string
          p_discount_code: string
          p_start_date: string
          p_end_date: string
        }
        Returns: {
          orders_count: number
          total_revenue: number
          total_discount: number
          unique_customers: number
          avg_order_value: number
        }[]
      }
      
      get_product_profitability: {
        Args: {
          p_shop_id: string
          p_sku: string
          p_start_date: string
          p_end_date: string
        }
        Returns: {
          total_revenue: number
          total_cost: number
          total_profit: number
          profit_margin: number
          quantity_sold: number
        }[]
      }
      
      cleanup_expired_raw_data: {
        Args: {}
        Returns: number
      }

      cleanup_expired_recommendations: {
        Args: {}
        Returns: number
      }

      cleanup_resolved_alerts: {
        Args: {}
        Returns: number
      }

      cleanup_completed_etl_jobs: {
        Args: {}
        Returns: number
      }

      run_data_retention_cleanup: {
        Args: {}
        Returns: {
          cleanup_date: string
          raw_data_deleted: number
          recommendations_deleted: number
          alerts_deleted: number
          etl_jobs_deleted: number
          total_deleted: number
        }
      }

      get_data_retention_stats: {
        Args: {}
        Returns: {
          raw_orders_count: number
          raw_products_count: number
          raw_customers_count: number
          raw_discounts_count: number
          expired_orders_count: number
          expired_products_count: number
          expired_customers_count: number
          expired_discounts_count: number
          active_recommendations_count: number
          expired_recommendations_count: number
          active_alerts_count: number
          resolved_alerts_count: number
          completed_etl_jobs_count: number
          old_etl_jobs_count: number
          generated_at: string
        }
      }
    }
  }
}