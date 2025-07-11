import prisma from "../db.server";
import shopify from "../shopify.server";

// Service to apply metafield rules to a product
export async function applyMetafieldRulesToProduct(productId, shop, session) {
  // Fetch all rules
  const rules = await prisma.metafieldRule.findMany();
  if (!rules.length) return;

  // Get product details (including collections)
  const { admin } = await shopify.authenticate.admin(session);
  const productRes = await admin.graphql(`{
    product(id: \"gid://shopify/Product/${productId}\") {
      id
      title
      collections(first: 10) { nodes { title } }
    }
  }`);
  const productData = await productRes.json();
  const product = productData.data.product;
  if (!product) return;

  // For each rule, check if product matches (by collection)
  for (const rule of rules) {
    const inCollection = product.collections.nodes.some(
      (c) => c.title === rule.collectionTitle
    );
    if (!inCollection) continue;

    // Assign metafield
    try {
      await admin.graphql(`
        mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields { id namespace key value type }
            userErrors { field message }
          }
        }
      `, {
        metafields: [{
          ownerId: product.id,
          namespace: rule.namespace,
          key: rule.key,
          type: rule.type,
          value: rule.value,
        }],
      });
      await prisma.metafieldLog.create({
        data: {
          ruleId: rule.id,
          productId: productId.toString(),
          status: "success",
          message: null,
        },
      });
    } catch (err) {
      await prisma.metafieldLog.create({
        data: {
          ruleId: rule.id,
          productId: productId.toString(),
          status: "failure",
          message: err.message || String(err),
        },
      });
    }
  }
}

// Apply all rules to all products in the store
export async function applyMetafieldRulesToAllProducts(shop, session) {
  const rules = await prisma.metafieldRule.findMany();
  if (!rules.length) return;
  const { admin } = await shopify.authenticate.admin(session);
  // Get all products (first 100 for now)
  const productsRes = await admin.graphql(`{
    products(first: 100) { nodes { id title collections(first: 10) { nodes { title } } } }
  }`);
  const productsData = await productsRes.json();
  const products = productsData.data.products.nodes;
  for (const product of products) {
    for (const rule of rules) {
      const inCollection = product.collections.nodes.some(
        (c) => c.title === rule.collectionTitle
      );
      if (!inCollection) continue;
      try {
        await admin.graphql(`
          mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
            metafieldsSet(metafields: $metafields) {
              metafields { id namespace key value type }
              userErrors { field message }
            }
          }
        `, {
          metafields: [{
            ownerId: product.id,
            namespace: rule.namespace,
            key: rule.key,
            type: rule.type,
            value: rule.value,
          }],
        });
        await prisma.metafieldLog.create({
          data: {
            ruleId: rule.id,
            productId: product.id.split("/").pop(),
            status: "success",
            message: null,
          },
        });
      } catch (err) {
        await prisma.metafieldLog.create({
          data: {
            ruleId: rule.id,
            productId: product.id.split("/").pop(),
            status: "failure",
            message: err.message || String(err),
          },
        });
      }
    }
  }
}