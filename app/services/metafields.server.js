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

    // Check if admin client is valid (has accessToken or shop)
    if (!admin || !admin.graphql) {
      const authError = 'Shopify admin client is not authenticated or missing.';
      console.error(authError);
      await prisma.metafieldLog.create({
        data: {
          ruleId: rule.id,
          productId: productId.toString(),
          status: "failure",
          message: JSON.stringify({ error: authError }),
        },
      });
      continue;
    }

    // Assign metafield
    try {
      const metafieldInput = {
        ownerId: product.id, // must be a GID
        namespace: rule.namespace,
        key: rule.key,
        type: rule.type,
        value: String(rule.value), // force value to string
      };
      console.log("Setting metafield:", metafieldInput);
      await admin.graphql(`
        mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            metafields { id namespace key value type }
            userErrors { field message }
          }
        }
      `, {
        metafields: [metafieldInput],
      });
      await prisma.metafieldLog.create({
        data: {
          ruleId: rule.id,
          productId: productId.toString(),
          status: "success",
          message: JSON.stringify({ input: metafieldInput }),
        },
      });
    } catch (err) {
      let errorDetails = { input: {
        ownerId: product.id,
        namespace: rule.namespace,
        key: rule.key,
        type: rule.type,
        value: String(rule.value),
      } };
      if (err && err.response) {
        errorDetails.status = err.response.status;
        try {
          errorDetails.body = await err.response.text();
        } catch (e) {
          errorDetails.body = 'Could not read response body';
        }
      } else {
        errorDetails.error = err.message || String(err);
        if (err.stack) errorDetails.stack = err.stack;
      }
      console.error('Metafield assignment error:', errorDetails);
      await prisma.metafieldLog.create({
        data: {
          ruleId: rule.id,
          productId: productId.toString(),
          status: "failure",
          message: JSON.stringify(errorDetails),
        },
      });
    }
  }
}

// Apply all rules to all products in the store
export async function applyMetafieldRulesToAllProducts(admin, shop, session) {
  const rules = await prisma.metafieldRule.findMany();
  if (!rules.length) return;
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
        let errorDetails = { input: {
          ownerId: product.id,
          namespace: rule.namespace,
          key: rule.key,
          type: rule.type,
          value: String(rule.value),
        } };
        if (err && err.response) {
          errorDetails.status = err.response.status;
          try {
            errorDetails.body = await err.response.text();
          } catch (e) {
            errorDetails.body = 'Could not read response body';
          }
        } else {
          errorDetails.error = err.message || String(err);
          if (err.stack) errorDetails.stack = err.stack;
        }
        console.error('Metafield assignment error:', errorDetails);
        await prisma.metafieldLog.create({
          data: {
            ruleId: rule.id,
            productId: product.id.split("/").pop(),
            status: "failure",
            message: JSON.stringify(errorDetails),
          },
        });
      }
    }
  }
}