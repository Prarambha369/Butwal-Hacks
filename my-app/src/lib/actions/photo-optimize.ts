'use server';

import { v2 as cloudinary } from 'cloudinary';
import { createServiceClient } from '@/utils/supabase';
import { logger } from '@/lib/logger';
import { requireMaintainer } from '@/lib/actions/admin';
import { OPTIMIZE_RECIPES, isValidRecipe, type OptimizeRecipe } from '@/lib/cloudinary-url';
import { revalidatePath } from 'next/cache';

function configured() {
  if (!cloudinary.config().cloud_name) {
    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
}

const PREVIEW_WIDTH = 1200;

export interface OptimizeVariant {
  recipe: OptimizeRecipe;
  label: string;
  transform: string;
  url: string;
  bytes: number | null;
  reductionPct: number | null;
}

export interface OptimizationPreview {
  photoId: string;
  original: { bytes: number; format: string; width: number; height: number; url: string };
  variants: OptimizeVariant[];
}

const RECIPE_LABELS: Record<OptimizeRecipe, string> = {
  balanced: 'Smart compression (q_auto + best format)',
  eco: 'Maximum savings (eco quality + best format)',
  enhanced: 'AI enhanced (auto enhance + smart compression)',
};

async function headBytes(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    if (!res.ok) return null;
    const len = res.headers.get('content-length');
    return len ? parseInt(len, 10) : null;
  } catch {
    return null;
  }
}

/**
 * Maintainer-only: live experiment panel data for one photo.
 * Costs ~1 transformation per variant previewed (CDN-cached after —
 * re-opening the panel is free). Original stats come from the Admin API.
 */
export async function getOptimizationPreview(photoId: string): Promise<OptimizationPreview> {
  await requireMaintainer();
  configured();
  const supabase = createServiceClient();

  const { data: photo, error } = await supabase
    .from('photos')
    .select('id, url, cloudinary_public_id')
    .eq('id', photoId)
    .single();
  if (error || !photo) throw new Error('Photo not found');
  const row = photo as { id: string; url: string; cloudinary_public_id: string | null };
  if (!row.cloudinary_public_id) {
    throw new Error('No Cloudinary reference stored for this photo (legacy upload)');
  }

  let resource: { bytes?: number; format?: string; width?: number; height?: number };
  try {
    resource = await cloudinary.api.resource(row.cloudinary_public_id, { resource_type: 'image' });
  } catch (err) {
    logger.error('Cloudinary resource lookup failed:', err);
    throw new Error('Could not read this asset from Cloudinary');
  }

  const originalBytes = resource.bytes ?? 0;
  const deliveryBase = row.url.replace(/\/image\/upload\/.*/, '/image/upload');

  const variants: OptimizeVariant[] = [];
  for (const [recipe, transform] of Object.entries(OPTIMIZE_RECIPES) as [OptimizeRecipe, string][]) {
    const url = `${deliveryBase}/w_${PREVIEW_WIDTH},${transform}/${row.cloudinary_public_id}`;
    const bytes = await headBytes(url);
    variants.push({
      recipe,
      label: RECIPE_LABELS[recipe],
      transform,
      url,
      bytes,
      reductionPct: bytes !== null && originalBytes > 0
        ? Math.round((1 - bytes / originalBytes) * 100)
        : null,
    });
  }

  return {
    photoId,
    original: {
      bytes: originalBytes,
      format: resource.format ?? 'unknown',
      width: resource.width ?? 0,
      height: resource.height ?? 0,
      url: row.url,
    },
    variants,
  };
}

/** Maintainer-only: pin a recipe to the photo (or 'none' to revert). */
export async function applyOptimization(photoId: string, recipe: OptimizeRecipe | 'none') {
  await requireMaintainer();
  const transform = recipe === 'none' ? null : OPTIMIZE_RECIPES[recipe];
  if (transform && !isValidRecipe(transform)) throw new Error('Unknown recipe');

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('photos')
    .update({ optimized_transform: transform })
    .eq('id', photoId);
  if (error) {
    logger.error('Error applying photo optimization:', error);
    throw new Error('Failed to save optimization');
  }
  revalidatePath('/gallery');
  revalidatePath('/');
  return { success: true };
}
