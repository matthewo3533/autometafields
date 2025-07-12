import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  // Log configuration details before auth attempt
  console.log("=== CHECK-AUTH CONFIGURATION DEBUG ===");
  console.log("SHOPIFY_API_KEY:", process.env.SHOPIFY_API_KEY ? `${process.env.SHOPIFY_API_KEY.substring(0, 8)}...` : "NOT SET");
  console.log("SHOPIFY_API_SECRET:", process.env.SHOPIFY_API_SECRET ? `${process.env.SHOPIFY_API_SECRET.substring(0, 8)}...` : "NOT SET");
  console.log("SHOPIFY_APP_URL:", process.env.SHOPIFY_APP_URL || "NOT SET");
  console.log("SCOPES:", process.env.SHOPES || "NOT SET");
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("Request URL:", request.url);
  console.log("=== END CHECK-AUTH CONFIGURATION DEBUG ===");
  
  try {
    await authenticate.admin(request);
    return json({ authCheck: true });
  } catch (err) {
    console.error("CHECK-AUTH ERROR:", err);
    return json({ authCheck: false });
  }
}; 