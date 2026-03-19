import { db } from "../src/lib/db";

async function main() {
  const total = await db.listing.count();
  const published = await db.listing.count({ where: { status: "published" } });
  const draft = await db.listing.count({ where: { status: "draft" } });
  const byCity = await db.listing.groupBy({ by: ["city"], _count: true, orderBy: { _count: { city: "desc" } } });
  console.log(`Total: ${total} | Published: ${published} | Draft: ${draft}`);
  console.log("By city:");
  for (const c of byCity) console.log(`  ${c.city}: ${c._count}`);
  await db.$disconnect();
}
main();
