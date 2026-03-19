import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET = process.env.S3_BUCKET_NAME || "barhop-ph-images";
const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "";

export async function createPresignedUploadUrl(
  filename: string,
  contentType: string
): Promise<{ uploadUrl: string; s3Key: string }> {
  const ext = filename.split(".").pop() || "jpg";
  const s3Key = `uploads/${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: s3Key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

  return { uploadUrl, s3Key };
}

export function getCdnUrl(s3Key: string): string {
  return `${CDN_URL}/${s3Key}`;
}

export function getVariantKey(baseKey: string, variant: string): string {
  const parts = baseKey.split(".");
  parts.pop();
  return `${parts.join(".")}-${variant}.webp`;
}
