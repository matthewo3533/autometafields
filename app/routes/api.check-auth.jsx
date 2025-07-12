import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { redirect } from "@remix-run/node";

export const loader = async ({ request }) => {
  // Handle HTTPS redirect without causing loops
  const url = new URL(request.url);
  const isHttps = url.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https';
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Only redirect if we're in production, not already HTTPS, and not in a redirect loop
  if (isProduction && !isHttps && url.protocol === 'http:') {
    const redirectCount = parseInt(request.headers.get('x-redirect-count') || '0');
    if (redirectCount < 3) { // Prevent infinite loops
      url.protocol = 'https:';
      console.log("CHECK-AUTH: Redirecting HTTP to HTTPS:", url.toString());
      const response = redirect(url.toString());
      response.headers.set('x-redirect-count', (redirectCount + 1).toString());
      return response;
    }
  }
  
  // Log configuration details before auth attempt
  console.log("=== CHECK-AUTH CONFIGURATION DEBUG ===");
  console.log("SHOPIFY_API_KEY:", process.env.SHOPIFY_API_KEY ? `${process.env.SHOPIFY_API_KEY.substring(0, 8)}...` : "NOT SET");
  console.log("SHOPIFY_API_SECRET:", process.env.SHOPIFY_API_SECRET ? `${process.env.SHOPIFY_API_SECRET.substring(0, 8)}...` : "NOT SET");
  console.log("SHOPIFY_APP_URL:", process.env.SHOPIFY_APP_URL || "NOT SET");
  console.log("SCOPES:", process.env.SCOPES || "NOT SET");
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("Request URL:", request.url);
  console.log("Request Protocol:", url.protocol);
  console.log("Is HTTPS:", isHttps);
  console.log("X-Forwarded-Proto:", request.headers.get('x-forwarded-proto'));
  console.log("=== END CHECK-AUTH CONFIGURATION DEBUG ===");
  
  try {
    await authenticate.admin(request);
    return json({ authCheck: true });
  } catch (err) {
    console.error("CHECK-AUTH ERROR:", err);
    return json({ authCheck: false });
  }
}; 