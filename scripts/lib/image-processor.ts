/**
 * Image processing and S3 upload for listing photos.
 *
 * Variants produced:
 *   thumb   200×200  cover crop  webp
 *   card    600×400  cover crop  webp
 *   hero   1200×600  cover crop  webp
 *   original  ≤2000px wide       webp
 *
 * Uploads to S3 with Cache-Control public, max-age=604800 (7 days).
 * Returns CDN URLs using NEXT_PUBLIC_CDN_URL env var.
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ImageVariants {
  original: string;
  thumb: string;
  card: string;
  hero: string;
}

// ---------------------------------------------------------------------------
// S3 client — lazy-initialised so env vars are read at call time.
// ---------------------------------------------------------------------------

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    const region = process.env.AWS_REGION;
    if (!region) throw new Error("AWS_REGION env var is not set");

    s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
      },
    });
  }
  return s3Client;
}

function getBucket(): string {
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) throw new Error("S3_BUCKET_NAME env var is not set");
  return bucket;
}

function getCdnBase(): string {
  const cdn = process.env.NEXT_PUBLIC_CDN_URL;
  if (!cdn) throw new Error("NEXT_PUBLIC_CDN_URL env var is not set");
  return cdn.replace(/\/$/, "");
}

// ---------------------------------------------------------------------------
// Processing helpers
// ---------------------------------------------------------------------------

async function toVariant(
  source: Buffer,
  options:
    | { type: "cover"; width: number; height: number }
    | { type: "resize"; maxWidth: number }
): Promise<Buffer> {
  let pipeline = sharp(source);

  if (options.type === "cover") {
    pipeline = pipeline.resize(options.width, options.height, { fit: "cover" });
  } else {
    pipeline = pipeline.resize(options.maxWidth, undefined, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  return pipeline.webp({ quality: 85 }).toBuffer();
}

async function uploadToS3(
  client: S3Client,
  bucket: string,
  key: string,
  body: Buffer
): Promise<void> {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "image/webp",
      CacheControl: "public, max-age=604800",
    })
  );
}

// ---------------------------------------------------------------------------
// Public function
// ---------------------------------------------------------------------------

/**
 * Processes an image buffer into four variants and uploads all to S3.
 *
 * @param imageBuffer  Raw image bytes (any format Sharp supports).
 * @param s3KeyPrefix  Key prefix e.g. "listings/clxyz123/photos/photo-1".
 *                     Variant suffixes are appended automatically.
 * @returns Object of CDN URLs keyed by variant name.
 */
export async function processAndUploadImage(
  imageBuffer: Buffer,
  s3KeyPrefix: string
): Promise<ImageVariants> {
  const client = getS3Client();
  const bucket = getBucket();
  const cdnBase = getCdnBase();

  const [thumbBuf, cardBuf, heroBuf, originalBuf] = await Promise.all([
    toVariant(imageBuffer, { type: "cover", width: 200, height: 200 }),
    toVariant(imageBuffer, { type: "cover", width: 600, height: 400 }),
    toVariant(imageBuffer, { type: "cover", width: 1200, height: 600 }),
    toVariant(imageBuffer, { type: "resize", maxWidth: 2000 }),
  ]);

  const keys = {
    thumb: `${s3KeyPrefix}-thumb.webp`,
    card: `${s3KeyPrefix}-card.webp`,
    hero: `${s3KeyPrefix}-hero.webp`,
    original: `${s3KeyPrefix}-original.webp`,
  };

  await Promise.all([
    uploadToS3(client, bucket, keys.thumb, thumbBuf),
    uploadToS3(client, bucket, keys.card, cardBuf),
    uploadToS3(client, bucket, keys.hero, heroBuf),
    uploadToS3(client, bucket, keys.original, originalBuf),
  ]);

  return {
    thumb: `${cdnBase}/${keys.thumb}`,
    card: `${cdnBase}/${keys.card}`,
    hero: `${cdnBase}/${keys.hero}`,
    original: `${cdnBase}/${keys.original}`,
  };
}
