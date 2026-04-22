import type { SupabaseBrowserClient } from "@/lib/supabase/client";
import { supabaseEnv } from "@/lib/supabase/env";

export type BrandAssetType = "logo" | "hero";

function getFileExtension(fileName: string) {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.at(-1)?.toLowerCase() ?? "bin" : "bin";
}

export async function uploadBrandAsset(
  client: SupabaseBrowserClient,
  businessId: string,
  assetType: BrandAssetType,
  file: File,
) {
  const extension = getFileExtension(file.name);
  const filePath = `${businessId}/${assetType}-${Date.now()}.${extension}`;

  const { error } = await client.storage.from(supabaseEnv.storageBucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: true,
  });

  if (error) {
    return {
      error: error.message,
      publicUrl: null as string | null,
      path: null as string | null,
    };
  }

  const { data } = client.storage.from(supabaseEnv.storageBucket).getPublicUrl(filePath);

  return {
    error: null,
    publicUrl: data.publicUrl,
    path: filePath,
  };
}
