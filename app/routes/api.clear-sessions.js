import { json } from "@remix-run/node";
import { sessionStorage } from "../shopify.server";

export const action = async ({ request }) => {
  try {
    console.log("=== CLEARING ALL SESSIONS ===");
    
    // Get all sessions and delete them
    const sessions = await sessionStorage.findSessionsByShop("feelcrystaltest.myshopify.com");
    let clearedCount = 0;
    
    for (const session of sessions) {
      await sessionStorage.deleteSession(session.id);
      clearedCount++;
    }
    
    console.log(`Cleared ${clearedCount} sessions`);
    console.log("=== END CLEARING SESSIONS ===");
    
    return json({ success: true, clearedCount });
  } catch (error) {
    console.error("Error clearing sessions:", error);
    return json({ success: false, error: error.message });
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