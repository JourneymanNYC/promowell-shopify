import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";

import { authenticate, registerWebhooks } from "../shopify.server";
import { supabaseAdmin } from "../supabase/client.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);

  // First-install only: insert shop into Supabase and register webhooks
  if (session?.shop && session.accessToken) {
    const { data: existing } = await supabaseAdmin
      .from("shops")
      .select("id")
      .eq("shop_domain", session.shop)
      .maybeSingle();

    if (!existing) {
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

      await registerWebhooks({ session });
    }
  }

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app">Dashboard</s-link>
        <s-link href="/app/additional">Settings</s-link>
      </s-app-nav>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
