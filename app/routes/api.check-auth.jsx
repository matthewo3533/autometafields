import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  try {
    await authenticate.admin(request);
    return json({ authCheck: true });
  } catch (err) {
    return json({ authCheck: false });
  }
}; 