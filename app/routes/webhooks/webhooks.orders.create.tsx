import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../../shopify.server";
import { ShopifyWebhookService } from "../../shopify/webhooks";
import type { WebhookPayload } from "../../shopify/webhooks";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { shop, payload, topic } = await authenticate.webhook(request);

    console.log(`Received ${topic} webhook for ${shop}`);

    if (!payload) {
      console.error("No payload received in webhook");
      return new Response("No payload", { status: 400 });
    }

    // Store order in Supabase
    await ShopifyWebhookService.handleOrderCreated(payload as WebhookPayload, shop);

    console.log(`Successfully processed order ${payload.name} for ${shop}`);
    
    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error processing orders/create webhook:", error);
    // Return 200 to prevent Shopify from retrying
    return new Response("Error processed", { status: 200 });
  }
};

