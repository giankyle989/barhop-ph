import { db } from "../src/lib/db";

async function main() {
  try {
    const count = await db.listing.count();
    console.log("Listing count:", count);
  } catch (e: unknown) {
    console.error("Type:", typeof e);
    console.error("Constructor:", (e as Record<string, unknown>)?.constructor?.name);
    // Try to get useful info
    if (e instanceof Error) {
      console.error("Message:", e.message);
      console.error("Stack:", e.stack);
    } else {
      // It might be an ErrorEvent from ws
      const ev = e as Record<string, unknown>;
      console.error("Keys:", Object.keys(ev));
      console.error("Type prop:", ev.type);
      console.error("Message prop:", ev.message);
      // Check for nested error
      const symbols = Object.getOwnPropertySymbols(ev);
      for (const s of symbols) {
        const val = ev[s as unknown as string];
        if (val instanceof Error) {
          console.error("Symbol error:", val.message);
        }
      }
    }
  } finally {
    await db.$disconnect();
  }
}
main();
