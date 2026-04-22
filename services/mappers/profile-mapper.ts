import type { Session } from "@supabase/supabase-js";

import type { AuthUser, UserRoleKey } from "@/types/auth";
import type { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"] | null;

function normalizeRole(roleKey?: string | null): UserRoleKey {
  if (roleKey === "owner" || roleKey === "admin" || roleKey === "manager") {
    return roleKey;
  }

  return "staff";
}

export function mapSessionToAuthUser(
  session: Session,
  profile: ProfileRow,
  roleKey?: string | null,
): AuthUser {
  const metadataName =
    typeof session.user.user_metadata.full_name === "string"
      ? session.user.user_metadata.full_name
      : null;

  return {
    id: session.user.id,
    email: session.user.email ?? "",
    fullName:
      profile?.full_name ?? metadataName ?? session.user.email?.split("@")[0] ?? "Usuario",
    role: normalizeRole(roleKey),
  };
}
