import { json } from "@remix-run/node";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export const loader = async () => {
  const logs = await prisma.metafieldLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { rule: true },
  });
  return json(logs);
};

export const checkAuth = async ({ request }) => {
  try {
    await authenticate.admin(request);
    return json({ authCheck: true });
  } catch (err) {
    return json({ authCheck: false });
  }
};

export const GET = async ({ request }) => {
  const url = new URL(request.url);
  if (url.pathname === "/api/check-auth") {
    return checkAuth({ request });
  }
  return loader({ request });
}; 