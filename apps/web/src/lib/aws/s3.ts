import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_USER_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_USER_SECRET_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "code-extract-screenshots";

/**
 * Upload a base64 image to S3 and return the public URL
 */
export async function uploadBase64ToS3(
  base64Data: string,
  key: string
): Promise<string> {
  // Remove data URL prefix if present (e.g., "data:image/png;base64,")
  const base64Clean = base64Data.replace(/^data:image\/\w+;base64,/, "");

  // Convert base64 to buffer
  const buffer = Buffer.from(base64Clean, "base64");

  // Detect content type from base64 prefix or default to png
  let contentType = "image/png";
  if (base64Data.startsWith("data:image/jpeg")) {
    contentType = "image/jpeg";
  } else if (base64Data.startsWith("data:image/webp")) {
    contentType = "image/webp";
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);

  // Return the public URL
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-2"}.amazonaws.com/${key}`;
}

/**
 * Upload multiple screenshots and return array of URLs
 */
export async function uploadScreenshotsToS3(
  screenshots: string[],
  sourceId: string
): Promise<string[]> {
  const urls: string[] = [];

  for (let i = 0; i < screenshots.length; i++) {
    const key = `screenshots/${sourceId}/${i}.png`;
    const url = await uploadBase64ToS3(screenshots[i], key);
    urls.push(url);
  }

  return urls;
}
