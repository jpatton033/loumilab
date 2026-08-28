import { supabase } from "@/integrations/supabase/client";

/**
 * Merchant branding and catalog imagery.
 *
 * Files live in the private `merchant-media` bucket under `<merchant_id>/<kind>/`,
 * so storage policies can prove ownership from the path. Uploads return a
 * long-lived signed URL that is stored on the storefront/product row, which keeps
 * every existing render path (`logo_url`, `image_url`) working unchanged.
 */

export const MERCHANT_MEDIA_BUCKET = "merchant-media";

/** Ten years — the URL is stored on the row and read by customers. */
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10;

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export type MediaKind = "logo" | "hero" | "item";

export interface UploadedMedia {
  path: string;
  url: string;
}

const extensionFor = (file: File) => {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  return file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
};

export const uploadMerchantImage = async (
  merchantId: string,
  kind: MediaKind,
  file: File,
): Promise<UploadedMedia> => {
  if (!ALLOWED.includes(file.type)) {
    throw new Error("Use a PNG, JPG, WebP or SVG image.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Images must be 5 MB or smaller.");
  }

  const path = `${merchantId}/${kind}/${crypto.randomUUID()}.${extensionFor(file)}`;
  const { error } = await supabase.storage
    .from(MERCHANT_MEDIA_BUCKET)
    .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
  if (error) throw error;

  const { data, error: signError } = await supabase.storage
    .from(MERCHANT_MEDIA_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (signError || !data?.signedUrl) throw signError ?? new Error("Couldn't prepare that image.");

  return { path, url: data.signedUrl };
};
