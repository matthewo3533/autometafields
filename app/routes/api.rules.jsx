import { json } from "@remix-run/node";
import prisma from "../db.server";

export const loader = async () => {
  const rules = await prisma.metafieldRule.findMany({
    orderBy: { createdAt: "desc" },
  });
  return json(rules);
};

export const action = async ({ request }) => {
  const { _method, id, rule } = await request.json();
  
  if (_method === "create") {
    const newRule = await prisma.metafieldRule.create({ data: rule });
    return json(newRule);
  } else if (_method === "update") {
    const updatedRule = await prisma.metafieldRule.update({
      where: { id: parseInt(id) },
      data: rule,
    });
    return json(updatedRule);
  } else if (_method === "delete") {
    await prisma.metafieldRule.delete({ where: { id: parseInt(id) } });
    return json({ success: true });
  }
  
  return json({ error: "Invalid method" }, { status: 400 });
}; 