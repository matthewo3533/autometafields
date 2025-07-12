import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

// Ensure HTTPS is always used for app URL
const appUrl = (process.env.SHOPIFY_APP_URL || "https://autometafields.onrender.com").replace(/^http:/, 'https:');

// Log the app configuration
console.log("=== SHOPIFY APP CONFIGURATION ===");
console.log("API Key:", process.env.SHOPIFY_API_KEY ? `${process.env.SHOPIFY_API_KEY.substring(0, 8)}...` : "NOT SET");
console.log("Original App URL:", process.env.SHOPIFY_APP_URL || "NOT SET");
console.log("Forced HTTPS App URL:", appUrl);
console.log("Scopes:", process.env.SCOPES || "NOT SET");
console.log("=== END SHOPIFY APP CONFIGURATION ===");

// Force HTTPS for authentication requests
const forceHttpsForAuth = (request) => {
  const url = new URL(request.url);
  if (url.protocol === 'http:') {
    url.protocol = 'https:';
    console.log("SHOPIFY AUTH: Forcing HTTPS for auth request:", url.toString());
    // Create a new request with HTTPS URL
    const newRequest = new Request(url.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    return newRequest;
  }
  return request;
};

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: appUrl,
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  // Force HTTPS for all requests
  isEmbeddedApp: true,
  // Custom request handler to force HTTPS for auth
  hooks: {
    beforeAuth: (request) => {
      return forceHttpsForAuth(request);
    },
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
