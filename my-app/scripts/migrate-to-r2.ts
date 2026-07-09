#!/usr/bin/env -S npx tsx

/**
 * Cloudflare R2 Migration Script
 *
 * Migrates media files from Cloudinary to Cloudflare R2.
 * Supports both images and videos.
 *
 * Usage:
 *   # Full migration (all resources)
 *   npx tsx scripts/migrate-to-r2.ts --full
 *
 *   # Dry run (no uploads, just list what would be migrated)
 *   npx tsx scripts/migrate-to-r2.ts --dry-run
 *
 *   # Migrate video-only (Cloudinary video is expensive)
 *   npx tsx scripts/migrate-to-r2.ts --type video
 *
 * Environment variables needed:
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 *
 * ponytail: Single-file migration script — no framework, no build step.
 * Upgrade path: Run as a cron job for ongoing sync.
 */

import { v2 as cloudinary } from "cloudinary";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import { createHash } from "crypto";

// ─── Config ──────────────────────────────────────────────────────────────────

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? "";
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY ?? "";
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET ?? "";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID ?? "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY ?? "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME ?? "butwal-hacks-media";

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const isFull = args.includes("--full");
const mediaType = args.includes("--type")
  ? args[args.indexOf("--type") + 1]
  : "all";

// ─── Clients ─────────────────────────────────────────────────────────────────

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function* listCloudinaryResources(resourceType: "image" | "video", cursor?: string): AsyncGenerator<any> {
  const result = await cloudinary.api.resources({
    type: "upload",
    resource_type: resourceType,
    max_results: 100,
    next_cursor: cursor,
  });

  for (const resource of result.resources) {
    yield resource;
  }

  if (result.next_cursor) {
    yield* listCloudinaryResources(resourceType, result.next_cursor);
  }
}

async function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    }).on("error", (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function uploadToR2(filePath: string, key: string): Promise<void> {
  const fileContent = fs.readFileSync(filePath);
  const contentType = key.endsWith(".mp4")
    ? "video/mp4"
    : key.endsWith(".webm")
    ? "video/webm"
    : key.endsWith(".png")
    ? "image/png"
    : key.endsWith(".jpg") || key.endsWith(".jpeg")
    ? "image/jpeg"
    : key.endsWith(".webp")
    ? "image/webp"
    : "application/octet-stream";

  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: contentType,
    }),
  );
}

function fileHash(filePath: string): string {
  return createHash("md5").update(fs.readFileSync(filePath)).digest("hex");
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚀 Cloudinary → R2 Migration\n`);
  console.log(`Dry run: ${isDryRun ? "✅ YES" : "❌ NO"}`);
  console.log(`Media type: ${mediaType}\n`);

  if (!CLOUDINARY_API_KEY || !R2_ACCESS_KEY_ID) {
    console.error("❌ Missing required environment variables.");
    console.error("   Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET");
    console.error("   Required: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY");
    process.exit(1);
  }

  // Ensure temp directory exists
  const tmpDir = path.join(process.cwd(), ".r2-migration-tmp");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const resourceTypes = mediaType === "all"
    ? ["image" as const, "video" as const]
    : [mediaType as "image" | "video"];

  let totalMigrated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const resourceType of resourceTypes) {
    console.log(`\n📦 Processing ${resourceType}s...\n`);

    let count = 0;

    for await (const resource of listCloudinaryResources(resourceType)) {
      count++;
      const publicId = resource.public_id;
      const format = resource.format;
      const url = resource.secure_url;
      const key = `${resourceType}s/${publicId}.${format}`;
      const filePath = path.join(tmpDir, `${publicId.replace(/\//g, "_")}.${format}`);

      console.log(`  [${count}] ${publicId}.${format}`);

      if (isDryRun) {
        console.log(`       → Would upload to r2://${R2_BUCKET_NAME}/${key}`);
        continue;
      }

      try {
        // Check if already exists in R2
        try {
          await r2.send(new ListObjectsV2Command({
            Bucket: R2_BUCKET_NAME,
            Prefix: key,
            MaxKeys: 1,
          }));
          // If no error, object exists — skip
          console.log(`       ⏭ Skipped (already in R2)`);
          totalSkipped++;
          continue;
        } catch {
          // Object doesn't exist — proceed with upload
        }

        // Download from Cloudinary
        console.log(`       ↓ Downloading...`);
        await downloadFile(url, filePath);
        const localHash = fileHash(filePath);

        // Upload to R2
        console.log(`       ↑ Uploading to R2...`);
        await uploadToR2(filePath, key);

        console.log(`       ✅ Migrated (${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)} MB)`);
        totalMigrated++;

        // Cleanup temp file
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`       ❌ Error: ${err instanceof Error ? err.message : String(err)}`);
        totalErrors++;
        // Cleanup on error
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    }

    console.log(`\n📊 ${resourceType}s processed: ${count}`);
  }

  // Cleanup temp directory
  fs.rmSync(tmpDir, { recursive: true, force: true });

  // Summary
  console.log(`\n═══════════════════════════════════`);
  console.log(`✅ Migration complete`);
  console.log(`   Migrated: ${totalMigrated}`);
  console.log(`   Skipped:  ${totalSkipped}`);
  console.log(`   Errors:   ${totalErrors}`);
  console.log(`═══════════════════════════════════\n`);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
