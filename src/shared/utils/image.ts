import type { ImagePickerAsset } from 'expo-image-picker';

/** Max accepted image upload size. Picked images are already compressed, so this
 *  mainly stops pathological originals (uncompressed/huge) reaching Storage. */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_MB = Math.round(MAX_IMAGE_BYTES / (1024 * 1024));

/**
 * Validate a picked asset before upload. Returns a user-facing error message, or
 * null if acceptable. Run this right after the picker returns an asset.
 */
export function validatePickedImage(asset: ImagePickerAsset): string | null {
  if (asset.type && asset.type !== 'image') {
    return 'Please choose an image, not a video.';
  }
  const mime = asset.mimeType ?? '';
  if (mime && !mime.startsWith('image/')) {
    return 'That file isn’t a supported image.';
  }
  if (typeof asset.fileSize === 'number' && asset.fileSize > MAX_IMAGE_BYTES) {
    return `Image is too large (max ${MAX_MB} MB). Pick a smaller one.`;
  }
  return null;
}

/** Backstop used inside upload services after the local blob is fetched. Size
 *  only — blob.type is unreliable for local file URIs in React Native. */
export function blobTooLarge(blob: Blob): boolean {
  return blob.size > MAX_IMAGE_BYTES;
}
