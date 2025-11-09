import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { supabaseAdmin } from "../supabase/client";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { session } = await authenticate.admin(request);
    if (!session || !session.shop) {
      return new Response(JSON.stringify({ ok: false, error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    type SessionLike = { scope?: string | string[] };
    const scopeValue = (session as unknown as SessionLike).scope;
    const scopesArray: string[] = Array.isArray(scopeValue)
      ? scopeValue
      : typeof scopeValue === "string"
      ? scopeValue.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    // Upsert shop row (create if missing, update token/scope/is_active if present)
    const { error } = await supabaseAdmin
      .from("shops")
      .upsert(
        {
          shop_domain: session.shop,
          shop_name: session.shop,
          access_token: session.accessToken,
          scope: scopesArray.length ? scopesArray : null,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "shop_domain", ignoreDuplicates: false }
      );

    if (error) {
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, shop: session.shop }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: (error as Error).message || "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const action = async ({ request }: LoaderFunctionArgs) => {
  return loader({ request } as LoaderFunctionArgs);
};


