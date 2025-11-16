// React and Remix
import type {
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
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

// Loader function to fetch discounts and metrics
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  // Get parameters from URL search params
  const url = new URL(request.url);
  const timePeriod = url.searchParams.get('period') || '7';
  const selectedDiscount = url.searchParams.get('discount') || 'all';

  // Fetch discounts from shopify_discounts_raw table
  const { data: shopData } = await supabaseAdmin
    .from('shops')
    .select('id')
    .eq('shop_domain', session.shop)
    .single();

  if (!shopData) {
    return { discounts: [], metricsCardMetrics: null, timePeriod, selectedDiscount };
  }

  const { data: discounts, error } = await supabaseAdmin
    .from('shopify_discounts_raw')
    .select('id, shopify_discount_id, code, title, status, discount_type')
    .eq('shop_id', shopData.id)
    .order('status', { ascending: false }) // ACTIVE first
    .order('title', { ascending: true });

  if (error) {
    console.error('Error fetching discounts:', error);
    return { discounts: [], metricsCardMetrics: null, timePeriod, selectedDiscount };
  }

  // Separate active and inactive
  const activeDiscounts = discounts?.filter(d => d.status === 'ACTIVE') || [];
  const inactiveDiscounts = discounts?.filter(d => d.status !== 'ACTIVE') || [];

  const finalDiscounts = [...activeDiscounts, ...inactiveDiscounts];

  console.log('Loader: Fetched discounts:', {
    total: finalDiscounts.length,
    active: activeDiscounts.length,
    inactive: inactiveDiscounts.length
  });

  // Calculate date ranges for metrics
  const today = new Date();
  const startDate = new Date();

  // Calculate current period start date
  if (timePeriod === 'all') {
    // For 'all', get the earliest date from the table
    startDate.setFullYear(2000, 0, 1); // Set to a very old date
  } else {
    const days = parseInt(timePeriod);
    startDate.setDate(today.getDate() - days);
  }

  // Calculate previous period dates (for comparison)
  const previousEndDate = new Date(startDate);
  previousEndDate.setDate(previousEndDate.getDate() - 1);

  const previousStartDate = new Date(previousEndDate);
  if (timePeriod !== 'all') {
    const days = parseInt(timePeriod);
    previousStartDate.setDate(previousEndDate.getDate() - days);
  }

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

  // Build current period metrics query
  let currentMetricsQuery = supabaseAdmin
    .from('discount_performance_daily')
    .select('total_orders_value, orders_count, revenue_uplift, average_order_value, total_discount_expense')
    .eq('shop_id', shopData.id)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', today.toISOString().split('T')[0]);

  // Filter by numeric discount_id if a specific discount is selected
  if (numericDiscountId !== null) {
    currentMetricsQuery = currentMetricsQuery.eq('discount_id', numericDiscountId);
  }

  const { data: currentMetrics } = await currentMetricsQuery;

  // Build previous period metrics query (for comparison)
  let previousMetricsQuery = timePeriod !== 'all' ? supabaseAdmin
    .from('discount_performance_daily')
    .select('total_orders_value, orders_count, revenue_uplift, average_order_value, total_discount_expense')
    .eq('shop_id', shopData.id)
    .gte('date', previousStartDate.toISOString().split('T')[0])
    .lte('date', previousEndDate.toISOString().split('T')[0])
    : null;

  // Filter by numeric discount_id if a specific discount is selected
  if (previousMetricsQuery && numericDiscountId !== null) {
    previousMetricsQuery = previousMetricsQuery.eq('discount_id', numericDiscountId);
  }

  const { data: previousMetrics } = previousMetricsQuery ? await previousMetricsQuery : { data: null };

  // Aggregate metrics
  const aggregateMetrics = (data: any[]) => {
    if (!data || data.length === 0) return null;

    return data.reduce((acc, day) => ({
      totalOrdersValue: (acc.totalOrdersValue || 0) + (day.total_orders_value || 0),
      ordersCount: (acc.ordersCount || 0) + (day.orders_count || 0),
      revenueUplift: (acc.revenueUplift || 0) + (day.revenue_uplift || 0),
      averageOrderValue: (acc.averageOrderValue || 0) + (day.average_order_value || 0),
      totalDiscountExpense: (acc.totalDiscountExpense || 0) + (day.total_discount_expense || 0),
      count: (acc.count || 0) + 1,
    }), { totalOrdersValue: 0, revenueUplift: 0, averageOrderValue: 0, totalDiscountExpense: 0, count: 0 });
  };

  const currentAgg = aggregateMetrics(currentMetrics || []);
  const previousAgg = aggregateMetrics(previousMetrics || []);

  console.log('Metrics aggregation:', {
    currentMetricsCount: currentMetrics?.length,
    previousMetricsCount: previousMetrics?.length,
    currentAgg,
    previousAgg
  });

  // Calculate average AOV (since it's averaged per day)
  const metricsCardMetrics = currentAgg ? {
    totalOrdersValue: currentAgg.totalOrdersValue,
    ordersCount: currentAgg.ordersCount,
    revenueUplift: currentAgg.revenueUplift,
    averageOrderValue: currentAgg.ordersCount > 0 ? currentAgg.totalOrdersValue / currentAgg.ordersCount : 0,
    totalDiscountExpense: currentAgg.totalDiscountExpense,
    previousTotalOrdersValue: previousAgg?.totalOrdersValue,
    previousRevenueUplift: previousAgg?.revenueUplift,
    previousAverageOrderValue: previousAgg && previousAgg.count > 0
      ? previousAgg.totalOrdersValue / previousAgg.ordersCount
      : undefined,
    previousTotalDiscountExpense: previousAgg?.totalDiscountExpense,
  } : null;

  console.log('Final metricsCardMetrics:', metricsCardMetrics);

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

  // Ensure today is always included in the chart
  const hasTodayData = areaChartMetrics.some(metric => metric.name === todayDateString);
  if (!hasTodayData && timePeriod !== 'all') {
    areaChartMetrics.push({
      name: todayDateString,
      Sales: 0
    });
    // Sort by date to ensure today appears at the end
    areaChartMetrics.sort((a, b) => a.name.localeCompare(b.name));
  }

  console.log('AreaChart transformed data:', {
    count: areaChartMetrics.length,
    sample: areaChartMetrics[0],
    includesIToday: hasTodayData,
    todayDate: todayDateString
  });

  return {
    discounts: finalDiscounts,
    metricsCardMetrics,
    areaChartMetrics,
    timePeriod,
    selectedDiscount
  };
};





export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  // Get data from loader
  const discounts = loaderData?.discounts || [];
  const metricsCardMetrics = loaderData?.metricsCardMetrics || null;
  const areaChartMetrics = loaderData?.areaChartMetrics || [];
  const timePeriod = loaderData?.timePeriod || '7';
  const selectedDiscount = loaderData?.selectedDiscount || 'all';

  console.log('Dashboard rendered with discounts:', discounts.length);

  // Handle time period change while preserving discount selection
  const handleTimePeriodChange = (period: string) => {
    navigate(`?period=${period}&discount=${selectedDiscount}`);
  };

  // Handle discount change while preserving time period
  const handleDiscountChange = (discount: string) => {
    navigate(`?period=${timePeriod}&discount=${discount}`);
  };

  return (
    <s-page heading="Promowell Dashboard">
      <s-button slot="primary-action">
        Refresh Analytics
      </s-button>
      <s-stack direction="block" gap="base">
        <s-stack direction="inline" justifyContent="space-between" gap="small">
          <DiscountMenu
            discounts={discounts}
            selectedDiscount={selectedDiscount}
            onSelectDiscount={handleDiscountChange}
          />
          <TimeFilter
            selectedTimePeriod={timePeriod}
            onSelectTimePeriod={handleTimePeriodChange}
          />
        </s-stack>

      <MetricsCard metrics={metricsCardMetrics} />

      <s-grid gridTemplateColumns="repeat(3, 1fr)" gap="base">
        <s-grid-item gridColumn="span 2" gridRow="span 1">
          <s-section heading="Discounted Sales Over Time">
            <s-box border="base" borderRadius="base" padding="base">
              <AreaChartDisplay metrics={areaChartMetrics} />
            </s-box>
          </s-section>
        </s-grid-item>
        <s-grid-item gridColumn="span 1" gridRow="span 1">
          <s-section heading="Next Chart">
            <s-box border="base" borderRadius="base" padding="base">
              <s-text color="subdued">Chart placeholder</s-text>
            </s-box>
          </s-section>
        </s-grid-item>
      </s-grid>

      <s-grid gridTemplateColumns="repeat(3, 1fr)" gap="base">
        <s-grid-item gridColumn="span 1" gridRow="span 1">
          <s-section heading="Next Chart"></s-section>
        </s-grid-item>
        <s-grid-item gridColumn="span 1" gridRow="span 1">
          <s-section heading="Next Chart"></s-section>
        </s-grid-item>
        <s-grid-item gridColumn="span 1" gridRow="span 1">
          <s-section heading="Next Chart"></s-section>
        </s-grid-item>
      </s-grid>

      <s-section padding="base">
        <s-table>
          <s-table-header-row>
            <s-table-header listSlot="primary">Product</s-table-header>
            <s-table-header listSlot="kicker">SKU</s-table-header>
            <s-table-header listSlot="inline">Status</s-table-header>
            <s-table-header listSlot="labeled" format="numeric">Inventory</s-table-header>
            <s-table-header listSlot="labeled" format="currency">Price</s-table-header>
            <s-table-header listSlot="labeled">Last updated</s-table-header>
          </s-table-header-row>

          <s-table-body>
            <s-table-row>
              <s-table-cell>Water bottle</s-table-cell>
              <s-table-cell>WB-001</s-table-cell>
              <s-table-cell>
                <s-badge tone="success">Active</s-badge>
              </s-table-cell>
              <s-table-cell>128</s-table-cell>
              <s-table-cell>$24.99</s-table-cell>
              <s-table-cell>2 hours ago</s-table-cell>
            </s-table-row>
            <s-table-row>
              <s-table-cell>T-shirt</s-table-cell>
              <s-table-cell>TS-002</s-table-cell>
              <s-table-cell>
                <s-badge tone="warning">Low stock</s-badge>
              </s-table-cell>
              <s-table-cell>15</s-table-cell>
              <s-table-cell>$19.99</s-table-cell>
              <s-table-cell>1 day ago</s-table-cell>
            </s-table-row>
            <s-table-row>
              <s-table-cell>Cutting board</s-table-cell>
              <s-table-cell>CB-003</s-table-cell>
              <s-table-cell>
                <s-badge tone="critical">Out of stock</s-badge>
              </s-table-cell>
              <s-table-cell>0</s-table-cell>
              <s-table-cell>$34.99</s-table-cell>
              <s-table-cell>3 days ago</s-table-cell>
            </s-table-row>
            <s-table-row>
              <s-table-cell>Notebook set</s-table-cell>
              <s-table-cell>NB-004</s-table-cell>
              <s-table-cell>
                <s-badge tone="success">Active</s-badge>
              </s-table-cell>
              <s-table-cell>245</s-table-cell>
              <s-table-cell>$12.99</s-table-cell>
              <s-table-cell>5 hours ago</s-table-cell>
            </s-table-row>
            <s-table-row>
              <s-table-cell>Stainless steel straws</s-table-cell>
              <s-table-cell>SS-005</s-table-cell>
              <s-table-cell>
                <s-badge tone="success">Active</s-badge>
              </s-table-cell>
              <s-table-cell>89</s-table-cell>
              <s-table-cell>$9.99</s-table-cell>
              <s-table-cell>1 hour ago</s-table-cell>
            </s-table-row>
          </s-table-body>
        </s-table>
      </s-section>

      </s-stack>

    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
