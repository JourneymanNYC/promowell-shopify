import { useEffect, useState } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

const promotions = [
  { id: "promo-1", name: "Holiday Sale" },
  { id: "promo-2", name: "Spring Clearance" },
  { id: "promo-3", name: "BOGO Weekend" },
  { id: "promo-4", name: "VIP Exclusive" },
];

const SelectionMenu = () => {
  const [selectedPromotion, setSelectedPromotion] = useState(promotions[0].id);

  return (
    <s-section padding="base">
        <s-grid gridTemplateColumns="1fr 1fr" gap="small">
          <s-select
            label="Select promotion"
            name="promotion"
            onChange={(e: any) => setSelectedPromotion(e.target.value)}
          >
            {promotions.map((p) => (
              <s-option key={p.id} value={p.id} selected={p.id === selectedPromotion}>
                {p.name}
              </s-option>
            ))}
          </s-select>
          <s-date-field label="Start Date"defaultView="2025-09" defaultValue="2025-09-01" />
        </s-grid>
      </s-section>
  )
}

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
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";

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
      
      <s-stack direction="inline" justifyContent="space-between" gap="small" paddingBlock="small-200">
        <s-button>
          All channels <s-icon type="caret-down"></s-icon>
        </s-button>
        <s-stack direction="inline" gap="small">
          <s-button icon="calendar">Last 7 days</s-button>
          <s-button icon="calendar">Last 30 days</s-button>
          <s-button icon="calendar">Last 90 days</s-button>
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

      <s-section heading="Discounted Sales Over Time">
        
      </s-section>

      <s-section heading="Next Chart">
        
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
