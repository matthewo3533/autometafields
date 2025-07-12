import { json } from "@remix-run/node";

export const loader = async ({ request }) => {
  console.log("=== TEST ROUTE HIT ===");
  console.log("Request URL:", request.url);
  console.log("Request method:", request.method);
  
  return json({ 
    message: "Test route working!",
    url: request.url,
    method: request.method,
    timestamp: new Date().toISOString()
  });
}; 