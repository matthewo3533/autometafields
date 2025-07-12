import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { redirect } from "@remix-run/node";

export const loader = async ({ request }) => {
  console.log("=== CHECK-AUTH ROUTE HIT ===");
  console.log("Request URL:", request.url);
  console.log("Request method:", request.method);
  console.log("Request headers:", Object.fromEntries(request.headers.entries()));
  
  // Log configuration details before auth attempt
  console.log("=== CHECK-AUTH CONFIGURATION DEBUG ===");
  console.log("SHOPIFY_API_KEY:", process.env.SHOPIFY_API_KEY ? `${process.env.SHOPIFY_API_KEY.substring(0, 8)}...` : "NOT SET");
  console.log("SHOPIFY_API_SECRET:", process.env.SHOPIFY_API_SECRET ? `${process.env.SHOPIFY_API_SECRET.substring(0, 8)}...` : "NOT SET");
  console.log("SHOPIFY_APP_URL:", process.env.SHOPIFY_APP_URL || "NOT SET");
  console.log("SCOPES:", process.env.SCOPES || "NOT SET");
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("Request URL:", request.url);
  console.log("Request Protocol:", new URL(request.url).protocol);
  console.log("Is HTTPS:", new URL(request.url).protocol === 'https:');
  console.log("X-Forwarded-Proto:", request.headers.get('x-forwarded-proto'));
  console.log("=== END CHECK-AUTH CONFIGURATION DEBUG ===");
  
  try {
    await authenticate.admin(request);
    console.log("=== CHECK-AUTH SUCCESS ===");
    return json({ authCheck: true });
  } catch (err) {
    console.error("=== CHECK-AUTH ERROR ===", err);
    return json({ authCheck: false, error: err.message });
  }
}; 