export const supabaseEnv = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  storageBucket: process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "brand-assets",
  invitationEmailsEnabled: process.env.NEXT_PUBLIC_ENABLE_INVITATION_EMAILS === "true",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
};

export function isSupabaseConfigured() {
  return Boolean(supabaseEnv.url && supabaseEnv.anonKey);
}
