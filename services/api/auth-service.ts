import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { SignInCredentials } from "@/types/auth";

export async function signInWithPassword(credentials: SignInCredentials) {
  const client = getSupabaseBrowserClient();

  if (!client) {
    return { error: "Supabase no esta configurado." };
  }

  const { error } = await client.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  return { error: error?.message ?? null };
}

export async function signOutCurrentUser() {
  const client = getSupabaseBrowserClient();

  if (!client) {
    return { error: null };
  }

  const { error } = await client.auth.signOut();
  return { error: error?.message ?? null };
}
