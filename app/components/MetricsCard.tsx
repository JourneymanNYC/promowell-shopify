interface MetricsData {
  totalOrdersValue: number;
  revenueUplift: number;
  averageOrderValue: number;
  totalDiscountExpense: number;
  // Optional: previous period data for calculating change percentages
  previousTotalOrdersValue?: number;
  previousRevenueUplift?: number;
  previousAverageOrderValue?: number;
  previousTotalDiscountExpense?: number;
}

interface MetricsCardProps {
  metrics: MetricsData | null;
}

// Helper function to format currency
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

// Helper function to format percentage
function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

// Helper function to calculate percentage change
function calculateChange(current: number, previous?: number): number | 'new' {
  if (!previous || previous === 0) return 'new';
  return ((current - previous) / previous) * 100;
}

export function MetricsCard({ metrics }: MetricsCardProps) {
  // Handle loading/error states
  if (!metrics) {
    return (
      <s-section padding="base">
        <s-text>Loading metrics...</s-text>
      </s-section>
    );
  }

  // Debug logging
  console.log('MetricsCard received:', {
    current: {
      totalOrdersValue: metrics.totalOrdersValue,
      revenueUplift: metrics.revenueUplift,
      averageOrderValue: metrics.averageOrderValue,
      totalDiscountExpense: metrics.totalDiscountExpense
    },
    previous: {
      totalOrdersValue: metrics.previousTotalOrdersValue,
      revenueUplift: metrics.previousRevenueUplift,
      averageOrderValue: metrics.previousAverageOrderValue,
      totalDiscountExpense: metrics.previousTotalDiscountExpense
    }
  });

  // Calculate changes
  const ordersValueChange = calculateChange(
    metrics.totalOrdersValue,
    metrics.previousTotalOrdersValue
  );
  const revenueUpliftChange = calculateChange(
    metrics.revenueUplift,
    metrics.previousRevenueUplift
  );
  const aovChange = calculateChange(
    metrics.averageOrderValue,
    metrics.previousAverageOrderValue
  );
  const discountExpenseChange = calculateChange(
    metrics.totalDiscountExpense,
    metrics.previousTotalDiscountExpense
  );

  console.log('Calculated changes:', {
    ordersValueChange,
    revenueUpliftChange,
    aovChange,
    discountExpenseChange
  });

  // Helper to get badge props
  const getBadgeProps = (change: number | 'new') => {
    if (change === 'new') return { tone: 'info' as const, icon: undefined };
    if (change > 0) return { tone: 'success' as const, icon: 'arrow-up' as const };
    if (change < 0) return { tone: 'critical' as const, icon: 'arrow-down' as const };
    return { tone: 'warning' as const, icon: undefined };
  };

  // Helper to format badge content
  const formatBadgeContent = (change: number | 'new') => {
    if (change === 'new') return 'New';
    return formatPercentage(Math.abs(change));
  };

  return (
    <s-section padding="base">
      <s-grid
        gridTemplateColumns="@container (inline-size <= 400px) 1fr, 1fr auto 1fr auto 1fr auto 1fr"
        gap="small"
      >
        {/* Total Orders Value */}
        <s-clickable
          href=""
          paddingBlock="small-400"
          paddingInline="small-100"
          borderRadius="base"
        >
          <s-grid gap="small-300">
            <s-heading>Total Orders Value</s-heading>
            <s-stack direction="inline" gap="small-200">
              <s-text>{formatCurrency(metrics.totalOrdersValue)}</s-text>
              <s-badge {...getBadgeProps(ordersValueChange)}>
                {formatBadgeContent(ordersValueChange)}
              </s-badge>
            </s-stack>
          </s-grid>
        </s-clickable>

        <s-divider direction="block" />

        {/* Revenue Uplift */}
        <s-clickable
          href=""
          paddingBlock="small-400"
          paddingInline="small-100"
          borderRadius="base"
        >
          <s-grid gap="small-300">
            <s-heading>Revenue Uplift</s-heading>
            <s-stack direction="inline" gap="small-200">
              <s-text>{formatCurrency(metrics.revenueUplift)}</s-text>
              <s-badge {...getBadgeProps(revenueUpliftChange)}>
                {formatBadgeContent(revenueUpliftChange)}
              </s-badge>
            </s-stack>
          </s-grid>
        </s-clickable>

        <s-divider direction="block" />

        {/* Average Order Value */}
        <s-clickable
          href=""
          paddingBlock="small-400"
          paddingInline="small-100"
          borderRadius="base"
        >
          <s-grid gap="small-300">
            <s-heading>Average Order Value</s-heading>
            <s-stack direction="inline" gap="small-200">
              <s-text>{formatCurrency(metrics.averageOrderValue)}</s-text>
              <s-badge {...getBadgeProps(aovChange)}>
                {formatBadgeContent(aovChange)}
              </s-badge>
            </s-stack>
          </s-grid>
        </s-clickable>

        <s-divider direction="block" />

        {/* Total Discount Expense */}
        <s-clickable
          href=""
          paddingBlock="small-400"
          paddingInline="small-100"
          borderRadius="base"
        >
          <s-grid gap="small-300">
            <s-heading>Discount Expense</s-heading>
            <s-stack direction="inline" gap="small-200">
              <s-text>{formatCurrency(metrics.totalDiscountExpense)}</s-text>
              <s-badge {...getBadgeProps(discountExpenseChange)}>
                {formatBadgeContent(discountExpenseChange)}
              </s-badge>
            </s-stack>
          </s-grid>
        </s-clickable>
      </s-grid>
    </s-section>
  );
}