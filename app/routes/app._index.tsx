import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from 'react-router';
import { useLoaderData } from 'react-router';

import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { supabaseAdmin } from "../supabase/client.server";
import Dashboard from "../components/Dashboard";

export const loader = async ({ request }: LoaderFunctionArgs) => {

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
    return { discounts: [], metricsCardMetrics: null, areaChartMetrics: [], timePeriod, selectedDiscount };
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
    return { discounts: [], metricsCardMetrics: null, areaChartMetrics: [], timePeriod, selectedDiscount };
  }

  // Separate active and inactive discounts
  const activeDiscounts = discounts.filter(discount => discount.status === 'ACTIVE') || [];
  const inactiveDiscounts = discounts.filter(discount => discount.status !== 'ACTIVE') || [];
  const finalDiscounts = [...activeDiscounts, ...inactiveDiscounts];

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
    .select('total_orders_value, orders_count, revenue_uplift, average_order_value, total_discount_expense')
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
    .select('total_orders_value, orders_count, revenue_uplift, average_order_value, total_discount_expense')
    .eq('shop_id', shopData.id)
    .gte('date', previousStartDate.toISOString().split('T')[0])
    .lte('date', previousEndDate.toISOString().split('T')[0]);

  if (previousMetricsQuery && numericDiscountId !== null) {
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
  const metricsCardMetrics = currentAgg ? {
    totalOrdersValue: currentAgg.totalOrdersValue,
    ordersCount: currentAgg.ordersCount,
    revenueUplift: currentAgg.revenueUplift,
    averageOrderValue: currentAgg.averageOrderValue,
    totalDiscountExpense: currentAgg.totalDiscountExpense,
    previousTotalOrdersValue: previousAgg?.totalOrdersValue,
    previousRevenueUplift: previousAgg?.revenueUplift,
    previousAverageOrderValue: previousAgg?.averageOrderValue,
    previousTotalDiscountExpense: previousAgg?.totalDiscountExpense,
  } : null;

  // ==================================
  // AreaChart Metrics Query
  // ==================================

  // Get metrics for AreaChart
  let areaChartMetricsQuery = supabaseAdmin
    .from('discount_performance_daily')
    .select('date, total_orders_value')
    .eq('shop_id', shopData.id)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', today.toISOString().split('T')[0])
    .order('date', { ascending: true });

  // Filter by numeric discount_id if a specific discount is selected
  if (numericDiscountId !== null) {
    areaChartMetricsQuery = areaChartMetricsQuery.eq('discount_id', numericDiscountId);
  }

  const { data: rawAreaChartMetrics, error: areaChartError } = await areaChartMetricsQuery;

  const todayDateString = today.toISOString().split('T')[0];

  console.log('AreaChart data fetch:', {
    rawDataCount: rawAreaChartMetrics?.length,
    error: areaChartError,
    dateRange: {
      start: startDate.toISOString().split('T')[0],
      end: todayDateString
    },
    sampleData: rawAreaChartMetrics?.[0]
  });

  // Transform data
  const areaChartMetrics = rawAreaChartMetrics?.map(item => ({
    name: item.date,
    Sales: item.total_orders_value || 0,
  })) || [];

  // ======================================================
  // Fetch REALTIME today's metrics directly (SUM on today)
  // ======================================================
  const { data: todayMetricsRaw } = await supabaseAdmin
    .from('discount_performance_daily')
    .select('total_orders_value')
    .eq('shop_id', shopData.id)
    .eq('date', todayDateString)
    .maybeSingle();

  const realTimeTodaySales = todayMetricsRaw?.total_orders_value || 0;

  // Ensure today is always included in the chart, using REAL values
  const hasTodayData = areaChartMetrics.some(metric => metric.name === todayDateString);

  if (!hasTodayData && timePeriod !== 'all') {
    areaChartMetrics.push({
      name: todayDateString,
      Sales: realTimeTodaySales,
    });

    areaChartMetrics.sort((a, b) => a.name.localeCompare(b.name));
  }

  console.log('=== LOADER RETURNING DATA ===', {
    discountsCount: finalDiscounts.length,
    metricsCardMetrics,
    areaChartMetricsCount: areaChartMetrics.length,
    timePeriod,
    selectedDiscount
  });

  return {
    discounts: finalDiscounts,
    metricsCardMetrics,
    areaChartMetrics,
    timePeriod,
    selectedDiscount
  };
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();

  console.log('=== INDEX COMPONENT RECEIVED ===', {
    loaderData,
    hasDiscounts: !!loaderData?.discounts,
    discountsLength: loaderData?.discounts?.length,
    hasMetrics: !!loaderData?.metricsCardMetrics
  });

  return (
    <Dashboard
      discounts={loaderData?.discounts || []}
      metricsCardMetrics={loaderData?.metricsCardMetrics || null}
      areaChartMetrics={loaderData?.areaChartMetrics || []}
      timePeriod={loaderData?.timePeriod || '7'}
      selectedDiscount={loaderData?.selectedDiscount || 'all'}
    />
  );
}
