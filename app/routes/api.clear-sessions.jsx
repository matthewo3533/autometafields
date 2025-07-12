import { json } from "@remix-run/node";
import prisma from "../db.server";

export const action = async ({ request }) => {
  try {
    // Clear all sessions
    const result = await prisma.session.deleteMany({});
    console.log(`Cleared ${result.count} sessions from database`);
    return json({ success: true, clearedCount: result.count });
  } catch (error) {
    console.error("Failed to clear sessions:", error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
};

export const loader = async () => {
  try {
    // Count sessions
    const count = await prisma.session.count();
    return json({ sessionCount: count });
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
}; 