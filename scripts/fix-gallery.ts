import { db } from "../src/lib/db";

async function main() {
  // Keep only the "original" variant in gallery, remove "hero" duplicates
  const listings = await db.listing.findMany({
    where: { gallery: { isEmpty: false } },
    select: { id: true, gallery: true },
  });

  let fixed = 0;
  for (const listing of listings) {
    const originals = listing.gallery.filter(url => url.includes("-original."));
    if (originals.length < listing.gallery.length) {
      await db.listing.update({
        where: { id: listing.id },
        data: { gallery: originals },
      });
      fixed++;
    }
  }

  console.log(`Fixed ${fixed} of ${listings.length} listings`);
  await db.$disconnect();
}
main();
