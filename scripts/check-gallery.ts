import { db } from "../src/lib/db";

async function main() {
  const listings = await db.listing.findMany({
    where: { gallery: { isEmpty: false } },
    select: { name: true, gallery: true },
    take: 3,
  });
  for (const l of listings) {
    console.log(`${l.name}: ${l.gallery.length} images`);
    for (const url of l.gallery) console.log(`  ${url}`);
  }
  await db.$disconnect();
}
main();
