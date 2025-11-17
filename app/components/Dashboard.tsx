import { useNavigate } from "react-router";

// Components
import { DiscountMenu } from "./Menu";
import { TimeFilter } from "./TimeFilter";
import { MetricsCard } from "./MetricsCard";
import { AreaChartDisplay } from "./AreaChart";

interface DashboardProps {
  discounts: any[];
  metricsCardMetrics: any;
  areaChartMetrics: any[];
  timePeriod: string;
  selectedDiscount: string;
}

export default function Dashboard({
  discounts,
  metricsCardMetrics,
  areaChartMetrics,
  timePeriod,
  selectedDiscount
}: DashboardProps) {
  const navigate = useNavigate();

  console.log('=== DASHBOARD COMPONENT PROPS ===', {
    discountsCount: discounts?.length,
    metricsCardMetrics,
    areaChartMetricsCount: areaChartMetrics?.length,
    timePeriod,
    selectedDiscount
  });

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
