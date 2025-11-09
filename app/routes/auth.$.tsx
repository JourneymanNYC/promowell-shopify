
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { authenticate, registerWebhooks } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { supabaseAdmin } from "../supabase/client";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  // Insert shop + register webhooks only on first install (no repeated writes on subsequent opens)
  if (session?.shop && session.accessToken) {
    const { data: existing } = await supabaseAdmin
      .from("shops")
      .select("id")
      .eq("shop_domain", session.shop)
      .maybeSingle();

    if (!existing) {
      // Build scopes array if present
      type SessionLike = { scope?: string | string[] };
      const scopeValue = (session as unknown as SessionLike).scope;
      const scopesArray: string[] = Array.isArray(scopeValue)
        ? scopeValue
        : typeof scopeValue === "string"
        ? scopeValue.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      await supabaseAdmin.from("shops").insert({
        shop_domain: session.shop,
        shop_name: session.shop,
        access_token: session.accessToken,
        scope: scopesArray.length ? scopesArray : null,
        is_active: true,
      });

      // Register webhooks once on first install
      await registerWebhooks({ session });
    }
  }

  return null;
};

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
