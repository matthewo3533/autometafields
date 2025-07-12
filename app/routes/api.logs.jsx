import { json } from "@remix-run/node";
import prisma from "../db.server";

export const loader = async () => {
  const logs = await prisma.metafieldLog.findMany({
    include: { rule: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return json(logs);
}; 