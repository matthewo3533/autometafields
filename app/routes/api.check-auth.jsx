import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { redirect } from "@remix-run/node";

export const loader = async ({ request }) => {
  // Force HTTPS redirect at the very beginning
  const url = new URL(request.url);
  if (url.protocol === 'http:' && process.env.NODE_ENV === 'production') {
    url.protocol = 'https:';
    console.log("CHECK-AUTH: Redirecting HTTP to HTTPS at response level:", url.toString());
    return redirect(url.toString());
  }
  
  // Force HTTPS for authentication
  let authRequest = request;
  const authUrl = new URL(request.url);
  if (authUrl.protocol === 'http:') {
    authUrl.protocol = 'https:';
    console.log("CHECK-AUTH: Forcing HTTPS for auth request:", authUrl.toString());
    authRequest = new Request(authUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
  }
  
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
  console.log("Auth Request URL:", authRequest.url);
  console.log("Auth Request Protocol:", new URL(authRequest.url).protocol);
  console.log("=== END CHECK-AUTH CONFIGURATION DEBUG ===");
  
  try {
    await authenticate.admin(authRequest);
    return json({ authCheck: true });
  } catch (err) {
    console.error("CHECK-AUTH ERROR:", err);
    return json({ authCheck: false });
  }
}; 