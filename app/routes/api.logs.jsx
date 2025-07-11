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