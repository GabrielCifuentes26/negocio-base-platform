import type { PermissionKey, UserRoleKey } from "@/types/auth";

import { getSupabaseBrowserClient, type SupabaseBrowserClient } from "@/lib/supabase/client";
import { getPermissionsByRole } from "@/lib/permissions/ability";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function getWorkspacePermissions({
  client,
  roleId,
  roleKey,
}: {
  client?: SupabaseBrowserClient | null;
  roleId?: string | null;
  roleKey?: string | null;
}) {
  const normalizedRole = (roleKey ?? "staff") as UserRoleKey;

  if (!isSupabaseConfigured() || !roleId) {
    return getPermissionsByRole(normalizedRole);
  }

  const activeClient = client ?? getSupabaseBrowserClient();

  if (!activeClient) {
    return getPermissionsByRole(normalizedRole);
  }

  const { data: rolePermissions, error } = await activeClient
    .from("role_permissions")
    .select("permission_id")
    .eq("role_id", roleId);

  if (error || !rolePermissions || rolePermissions.length === 0) {
    return getPermissionsByRole(normalizedRole);
  }

  const permissionIds = rolePermissions.map((item) => item.permission_id);
  const { data: permissions, error: permissionsError } = await activeClient
    .from("permissions")
    .select("key")
    .in("id", permissionIds);

  if (permissionsError || !permissions) {
    return getPermissionsByRole(normalizedRole);
  }

  return permissions
    .map((permission) => permission.key as PermissionKey)
    .filter(Boolean);
}
