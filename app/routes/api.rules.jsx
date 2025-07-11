import { json } from "@remix-run/node";
import prisma from "../db.server";

export const loader = async () => {
  const rules = await prisma.metafieldRule.findMany();
  return json(rules);
};

export const action = async ({ request }) => {
  const data = await request.json();
  switch (data._method) {
    case "create":
      // Exclude id from data.rule for create
      const { id: _id, ...createData } = data.rule;
      return json(await prisma.metafieldRule.create({ data: createData }));
    case "update":
      // Exclude id from data.rule for update
      const { id, ...ruleData } = data.rule;
      return json(await prisma.metafieldRule.update({ where: { id: data.id }, data: ruleData }));
    case "delete":
      // Only use id in where clause for delete
      return json(await prisma.metafieldRule.delete({ where: { id: data.id } }));
    default:
      return json({ error: "Invalid method" }, { status: 400 });
  }
}; 