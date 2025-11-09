import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { DiscountsSyncService } from "../shopify/services/discounts-sync.server";

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
    const daysBack = daysBackParam ? parseInt(daysBackParam, 10) : 365;

    if (isNaN(daysBack) || daysBack < 1 || daysBack > 730) {
      return new Response(JSON.stringify({ success: false, error: "daysBack must be between 1 and 730" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    console.log(`Manual discount sync triggered for ${session.shop} (${daysBack} days back)`);

    const result = await DiscountsSyncService.syncHistoricalDiscounts(
      admin,
      session.shop,
      daysBack
    );

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { "Content-Type": "application/json" }
    });
    
  } catch (error) {
    console.error("Error in manual discounts sync:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        discountsSynced: 0,
        codeDiscountsSynced: 0,
        automaticDiscountsSynced: 0,
        errors: [],
        startDate: "",
        endDate: ""
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const action = async ({ request }: LoaderFunctionArgs) => {
  return loader({ request } as LoaderFunctionArgs);
};


