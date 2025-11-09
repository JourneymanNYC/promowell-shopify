import type { LoaderFunctionArgs } from "react-router";
import { authenticate, registerWebhooks } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { session } = await authenticate.admin(request);
    if (!session || !session.shop) {
      return new Response(JSON.stringify({ ok: false, error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const result = await registerWebhooks({ session });
    return new Response(JSON.stringify({ ok: true, result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error registering webhooks:", error);
    return new Response(JSON.stringify({ ok: false, error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const action = async ({ request }: LoaderFunctionArgs) => {
  return loader({ request } as LoaderFunctionArgs);
};


