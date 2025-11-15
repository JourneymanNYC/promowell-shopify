import { useEffect } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const lineChartData = [
  { month: "January", revenue: 186 },
  { month: "February", revenue: 305 },
  { month: "March", revenue: 237 },
  { month: "April", revenue: 73 },
  { month: "May", revenue: 209 },
  { month: "June", revenue: 214 },
]


export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();

  const product = responseJson.data!.productCreate!.product!;
  const variantId = product.variants.edges[0]!.node!.id!;

  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyReactRouterTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`,
    {
      variables: {
        productId: product.id,
        variants: [{ id: variantId, price: "100.00" }],
      },
    },
  );

  const variantResponseJson = await variantResponse.json();

  return {
    product: responseJson!.data!.productCreate!.product,
    variant:
      variantResponseJson!.data!.productVariantsBulkUpdate!.productVariants,
  };
};

export default function Index() {
  const fetcher = useFetcher<typeof action>();

  const shopify = useAppBridge();

  useEffect(() => {
    if (fetcher.data?.product?.id) {
      shopify.toast.show("Product created");
    }
  }, [fetcher.data?.product?.id, shopify]);

  return (
    <s-page heading="Promowell Dashboard">
      <s-button slot="primary-action">
        View Dashboard
      </s-button>
      <s-stack direction="block" gap="base">
        <s-stack direction="inline" justifyContent="space-between" gap="small">
          <s-button>
            All channels <s-icon type="caret-down"></s-icon>
          </s-button>
          <s-stack direction="inline" gap="small">
            <s-button icon="calendar">Last 7 days</s-button>
            <s-button icon="calendar">Last 30 days</s-button>
            <s-button icon="calendar">Entire Period</s-button>
          </s-stack>
        </s-stack>

      <s-section padding="base">
        <s-grid
          gridTemplateColumns="@container (inline-size <= 400px) 1fr, 1fr auto 1fr auto 1fr auto 1fr"
          gap="small"
        >
          <s-clickable
            href=""
            paddingBlock="small-400"
            paddingInline="small-100"
            borderRadius="base"
          >
            <s-grid gap="small-300">
              <s-heading>Total Designs</s-heading>
              <s-stack direction="inline" gap="small-200">
                <s-text>156</s-text>
                <s-badge tone="success" icon="arrow-up">
                  {" "}
                  12%{" "}
                </s-badge>
              </s-stack>
            </s-grid>
          </s-clickable>
          <s-divider direction="block" />
          <s-clickable
            href=""
            paddingBlock="small-400"
            paddingInline="small-100"
            borderRadius="base"
          >
            <s-grid gap="small-300">
              <s-heading>Units Sold</s-heading>
              <s-stack direction="inline" gap="small-200">
                <s-text>2,847</s-text>
                <s-badge tone="warning">0%</s-badge>
              </s-stack>
            </s-grid>
          </s-clickable>
          <s-divider direction="block" />
          <s-clickable
            href=""
            paddingBlock="small-400"
            paddingInline="small-100"
            borderRadius="base"
          >
            <s-grid gap="small-300">
              <s-heading>Return Rate</s-heading>
              <s-stack direction="inline" gap="small-200">
                <s-text>3.2%</s-text>
                <s-badge tone="critical" icon="arrow-down">
                  {" "}
                  0.8%{" "}
                </s-badge>
              </s-stack>
            </s-grid>
          </s-clickable>
          <s-divider direction="block" />
          <s-clickable
            href=""
            paddingBlock="small-400"
            paddingInline="small-100"
            borderRadius="base"
          >
            <s-grid gap="small-300">
              <s-heading>Return Rate</s-heading>
              <s-stack direction="inline" gap="small-200">
                <s-text>3.2%</s-text>
                <s-badge tone="critical" icon="arrow-down">
                  {" "}
                  0.8%{" "}
                </s-badge>
              </s-stack>
            </s-grid>
          </s-clickable>
        </s-grid>
      </s-section>

      <s-grid gridTemplateColumns="repeat(3, 1fr)" gap="base">
        <s-grid-item gridColumn="span 2" gridRow="span 1">
          <s-section heading="Discounted Sales Over Time">
            <s-box border="base" borderRadius="base" padding="base">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={lineChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="date" tick={{ fill: "#8884d8" }} />
                  <YAxis tick={{ fill: "#8884d8" }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f1f1f", border: "none", borderRadius: 8 }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#8884d8"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#8884d8", strokeWidth: 2 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
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
