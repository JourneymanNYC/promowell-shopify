import type {
  HeaderFunction,
  LoaderFunctionArgs
} from 'react-router';

import { useLoaderData, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

// Supabase
import { supabaseAdmin } from "../supabase/client.server";

// Components
import { DiscountMenu } from "../components/Menu";
import { TimeFilter } from "../components/TimeFilter";
import { MetricsCard } from "../components/MetricsCard";
import { AreaChartDisplay } from "../components/AreaChart";
import { n } from 'node_modules/react-router/dist/development/index-react-server-client-B0vnxMMk.mjs';
import { supabase } from 'app/supabase/client';

export const leader = async ({ request }: LoaderFunctionArgs) => {
  
  // =======================
  // Authenticate admin user
  // =======================
  
  const { session } = await authenticate.admin(request);
  if (!session) {
    throw new Response("Unauthorized", { status: 401 });
  }

  //Fetch shop ID
  const { data: shopData } = await supabaseAdmin
    .from('shops')
    .select('id')
    .eq('shop_domain', session.shop)
    .single();
    
  if (!shopData) {
    return { discounts: [], metricsCardMetrics: null, areaChartMetrics: null, timePeriod, selectedDiscount };
  }

  // ==================================
  // Get search params and date ranges
  // ==================================

  // Get parameters from the request URL
  const url = new URL(request.url);
  const timePeriod = url.searchParams.get('period') || '7';
  const selectedDiscount = url.searchParams.get('discount') || 'all';

  // Calculate date ranges
  const today = new Date();
  const startDate = new Date();

  if (timePeriod === 'all') {
    startDate.setFullYear(startDate.getFullYear() - 5); // 5 years ago
  } else {
    startDate.setDate(startDate.getDate() - parseInt(timePeriod)); // sets time period back x days
  }

  // Calculate previous period for comparison
  const previousEndDate = new Date(startDate);
  previousEndDate.setDate(previousEndDate.getDate() - 1);
  const previousStartDate = new Date(previousEndDate);
  if (timePeriod === 'all') {
    previousStartDate.setFullYear(previousStartDate.getFullYear() - 5);
  } else {
    previousStartDate.setDate(previousStartDate.getDate() - parseInt(timePeriod));
  }

  // =================================================
  // Fetch discount information from Supabase
  // =================================================

  // Fetch discounts information; parse and order based on ACTIVE/INACTIVE status
  const { data: discounts, error } = await supabaseAdmin
  .from('shopify_discounts_raw')
  .select('id, shopify_discount_id, code, title, status, discount_type')
  .eq('shop_id', shopData.id)
  .order('status', { ascending: false })
  .order('title', { ascending: true });

  if (error) {
    console.error('Error fetching discounts:', error);
    return { discounts: [], metricsCardMetrics: null, areaChartMetrics: null, timePeriod, selectedDiscount };
  }

  // Separate active and inactive discounts
  const activeDiscounts = discounts.filter(discount => discount.status === 'ACTIVE') || [];
  const inactiveDiscounts = discounts.filter(discount => discount.status !== 'ACTIVE') || [];
  const finalDiscounts = [...activeDiscounts, ...inactiveDiscounts]; //CHECK THIS LINE
  
  // Get the numeric shopify_discount_id if a specific discount is selected
  let numericDiscountId: number | null = null;
  if (selectedDiscount !== 'all') {
    const selectedDiscountData = finalDiscounts.find(d => d.id === selectedDiscount);
    numericDiscountId = selectedDiscountData?.shopify_discount_id || null;
    console.log('Filtering by discount:', {
      selectedDiscount,
      numericDiscountId,
      discountCode: selectedDiscountData?.code
    });
  }

  // ================================================
  // Fetch Metrics for MetricsCard and AreaChart
  // ================================================
  
  // Build the base query
  let currentMetricsQuery = supabaseAdmin
    .from('discount_performance_daily')
    .select('total_order_value, orders_count, revenue_uplift, average_order_value, total_discount_expense')
    .eq('shop_id', shopData.id)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', today.toISOString().split('T')[0]);

  if (numericDiscountId !== null) {
    currentMetricsQuery = currentMetricsQuery.eq('discount_id', numericDiscountId);
  }

  const { data: currentMetrics } = await currentMetricsQuery;

  // Previous period metrics
  let previousMetricsQuery = supabaseAdmin
    .from('discount_performance_daily')
    .select('total_order_value, orders_count, revenue_uplift, average_order_value, total_discount_expense')
    .eq('shop_id', shopData.id)
    .gte('date', previousStartDate.toISOString().split('T')[0])
    .lte('date', previousEndDate.toISOString().split('T')[0]);

  if ( previousMetricsQuery && numericDiscountId !== null) {
    previousMetricsQuery = previousMetricsQuery.eq('discount_id', numericDiscountId);
  }

  const { data: previousMetrics } = previousMetricsQuery ? await previousMetricsQuery : { data: null };

  // Calculate aggregated metrics for MetricsCard
  const aggregateMetrics = (data: any[] | null) => {
  if (!data || data.length === 0) return null;

  const aggregated = data.reduce(
    (acc, day) => {
      const totalValue = day.total_orders_value || 0;
      const orders = day.orders_count || 0;
      const discountExpense = day.total_discount_expense || 0;

      return {
        totalOrdersValue: acc.totalOrdersValue + totalValue,
        ordersCount: acc.ordersCount + orders,
        totalDiscountExpense: acc.totalDiscountExpense + discountExpense,

        // Traditional revenue uplift
        revenueUplift: acc.revenueUplift + (totalValue - discountExpense),

        count: acc.count + 1,
      };
    },
    {
      totalOrdersValue: 0,
      ordersCount: 0,
      revenueUplift: 0,
      totalDiscountExpense: 0,
      count: 0,
    }
  );

  // Weighted Average Order Value
  const weightedAOV =
    aggregated.ordersCount > 0
      ? aggregated.totalOrdersValue / aggregated.ordersCount
      : 0;

  return {
    ...aggregated,
    averageOrderValue: weightedAOV,
  };
};

  const currentAgg = aggregateMetrics(currentMetrics || []);
  const previousAgg = aggregateMetrics(previousMetrics || []);

  // Prepare metrics for MetricsCard
  const metricsCardMetrics = currentAgg && previousAgg ? {
    totalOrdersValue: currentAgg.totalOrdersValue,
    totalOrdersValueChange: previousAgg.totalOrdersValue ? ((currentAgg.totalOrdersValue - previousAgg.totalOrdersValue) / previousAgg.totalOrdersValue) * 100 : null,
    ordersCount: currentAgg.ordersCount,
    ordersCountChange: previousAgg.ordersCount ? ((currentAgg.ordersCount - previousAgg.ordersCount) / previousAgg.ordersCount) * 100 : null,
    revenueUplift: currentAgg.revenueUplift,
    revenueUpliftChange: previousAgg.revenueUplift ? ((currentAgg.revenueUplift - previousAgg.revenueUplift) / previousAgg.revenueUplift) * 100 : null,
    averageOrderValue: currentAgg.averageOrderValue,
    averageOrderValueChange: previousAgg.averageOrderValue ? ((currentAgg.averageOrderValue - previousAgg.averageOrderValue) / previousAgg.averageOrderValue) * 100 : null,
    totalDiscountExpense: currentAgg.totalDiscountExpense,
    totalDiscountExpenseChange: previousAgg.totalDiscountExpense ? ((currentAgg.totalDiscountExpense - previousAgg.totalDiscountExpense) / previousAgg.totalDiscountExpense) * 100 : null,
  } : null;

  // ==================================
  // AreaChart Metrics Query
  // ==================================

  
}