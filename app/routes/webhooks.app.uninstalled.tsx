import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { ShopifyWebhookService } from "../shopify/webhooks";

export const loader = () =>
  new Response("Method Not Allowed", { status: 405 });

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  // Webhook requests can trigger multiple times and after an app has already been uninstalled.
  // If this webhook already ran, the session may have been deleted previously.
  if (session) {
    await db.session.deleteMany({ where: { shop } });
  }

  if (shop) {
    // Mark shop inactive and clean up raw data in Supabase
    await ShopifyWebhookService.handleAppUninstalled(shop);
  }

  return new Response();
};
 

