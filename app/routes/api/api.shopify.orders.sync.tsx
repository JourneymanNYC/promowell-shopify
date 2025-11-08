import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../../shopify.server";
import { OrdersSyncService } from "../../shopify/services/orders-sync.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    
    if (!session || !session.shop) {
      return new Response(JSON.stringify({ success: false, error: "No active session" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const url = new URL(request.url);
    const daysBackParam = url.searchParams.get("daysBack");
    const daysBack = daysBackParam ? parseInt(daysBackParam, 10) : 60;

    // Validate daysBack
    if (isNaN(daysBack) || daysBack < 1 || daysBack > 365) {
      return new Response(JSON.stringify({ success: false, error: "daysBack must be between 1 and 365" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    console.log(`Manual sync triggered for ${session.shop} (${daysBack} days back)`);

    // Trigger sync
    const result = await OrdersSyncService.syncHistoricalOrders(
      admin,
      session.shop,
      daysBack
    );

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    console.error("Error in manual orders sync:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        ordersSynced: 0,
        errors: [],
        startDate: "",
        endDate: ""
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Also support POST for triggering sync
export const action = async ({ request }: LoaderFunctionArgs) => {
  return loader({ request } as LoaderFunctionArgs);
};

