import { db } from "../src/lib/db";

async function main() {
  const listings = await db.listing.findMany({
    where: { imageUrl: { not: null } },
    select: { name: true, imageUrl: true },
    take: 3,
  });

  const noImage = await db.listing.count({ where: { imageUrl: null } });
  const hasImage = await db.listing.count({ where: { imageUrl: { not: null } } });

  console.log(`With image: ${hasImage} | Without: ${noImage}`);
  console.log("\nSample image URLs:");
  for (const l of listings) {
    console.log(`  ${l.name}: ${l.imageUrl}`);
  }

  await db.$disconnect();
}
main();
