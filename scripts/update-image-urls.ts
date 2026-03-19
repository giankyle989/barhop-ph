import { db } from "../src/lib/db";

const OLD_CDN = "https://cdn.barhop.ph";
const NEW_CDN = process.env.NEXT_PUBLIC_CDN_URL;

async function main() {
  if (!NEW_CDN) {
    console.error("NEXT_PUBLIC_CDN_URL is not set");
    process.exit(1);
  }

  console.log(`Replacing: ${OLD_CDN} → ${NEW_CDN}`);

  // Update imageUrl
  const imageResult = await db.$executeRaw`
    UPDATE listings SET image_url = REPLACE(image_url, ${OLD_CDN}, ${NEW_CDN})
    WHERE image_url LIKE ${OLD_CDN + '%'}
  `;
  console.log(`Updated ${imageResult} listing imageUrl fields`);

  // Update gallery array entries
  const galleryResult = await db.$executeRaw`
    UPDATE listings SET gallery = (
      SELECT array_agg(REPLACE(elem, ${OLD_CDN}, ${NEW_CDN}))
      FROM unnest(gallery) AS elem
    )
    WHERE array_length(gallery, 1) > 0
    AND EXISTS (SELECT 1 FROM unnest(gallery) AS elem WHERE elem LIKE ${OLD_CDN + '%'})
  `;
  console.log(`Updated ${galleryResult} listing gallery fields`);

  // Verify
  const remaining = await db.listing.count({
    where: { imageUrl: { startsWith: OLD_CDN } },
  });
  console.log(`Remaining with old CDN URL: ${remaining}`);

  // Show sample
  const sample = await db.listing.findFirst({
    where: { imageUrl: { not: null } },
    select: { name: true, imageUrl: true },
  });
  console.log(`Sample: ${sample?.name} → ${sample?.imageUrl}`);

  await db.$disconnect();
}

main();
