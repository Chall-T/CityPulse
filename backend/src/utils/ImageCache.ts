import crypto from "crypto";
import fs from "fs";
import path from "path";
import sharp from "sharp";

const CACHE_DIR = path.join(process.cwd(), "images", "cache");

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

export async function cacheImage(url: string): Promise<string> {
  const hash = crypto.createHash("sha1").update(url).digest("hex");
  const subDir = path.join(CACHE_DIR, hash.substring(0, 2));
  if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });

  const filename = path.join(subDir, `${hash}.webp`);

  // Already cached
  if (fs.existsSync(filename)) {
    return `/images/cache/${hash.substring(0, 2)}/${hash}.webp`;
  }

  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch image");
  const buffer = Buffer.from(await response.arrayBuffer());

  // 🔹 Resize to max 1920px width, preserving aspect ratio
  await sharp(buffer)
    .resize({
      width: 1920,
      withoutEnlargement: true, // don’t upscale smaller images
    })
    .webp({ quality: 80 })
    .toFile(filename);

  return `/images/cache/${hash.substring(0, 2)}/${hash}.webp`;
}
