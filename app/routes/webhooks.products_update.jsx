import { authenticate } from "../shopify.server";
import { applyMetafieldRulesToProduct } from "../services/metafields.server";

export const action = async ({ request }) => {
  const { payload, session, topic, shop } = await authenticate.webhook(request);
  const productId = payload.id;
  await applyMetafieldRulesToProduct(productId, shop, session);
  return new Response();
}; 