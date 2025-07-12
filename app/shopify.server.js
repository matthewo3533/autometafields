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

// Custom request handler to force HTTPS
const forceHttps = (request) => {
  const url = new URL(request.url);
  const isHttps = url.protocol === 'https:';
  
  if (url.protocol === 'http:') {
    url.protocol = 'https:';
    console.log("SHOPIFY CONFIG: Forcing HTTPS redirect:", url.toString());
    return Response.redirect(url.toString(), 301);
  }
  
  return null; // No redirect needed
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
  // Custom request handler
  hooks: {
    beforeAuth: (request) => {
      return forceHttps(request);
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
