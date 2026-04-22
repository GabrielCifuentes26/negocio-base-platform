import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { demoPermissions, demoRoles } from "@/services/api/demo-data";
import type { CreateRoleInput, PermissionListItem, RoleListItem } from "@/types/role";
import type { Database } from "@/types/database";

type RoleRow = Pick<
  Database["public"]["Tables"]["roles"]["Row"],
  "id" | "key" | "name" | "description" | "is_system" | "business_id"
>;

type PermissionRow = Pick<
  Database["public"]["Tables"]["permissions"]["Row"],
  "id" | "key" | "module_key" | "action" | "description"
>;

type RolePermissionRow = Database["public"]["Tables"]["role_permissions"]["Row"];
type MembershipRow = Pick<Database["public"]["Tables"]["business_memberships"]["Row"], "role_id">;

function slugifyKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function listPermissions() {
  if (!isSupabaseConfigured()) {
    return {
      mode: "demo" as const,
      rows: demoPermissions,
      error: null,
    };
  }

  const client = getSupabaseBrowserClient();

  if (!client) {
    return {
      mode: "demo" as const,
      rows: demoPermissions,
      error: null,
    };
  }

  const { data, error } = await client
    .from("permissions")
    .select("id, key, module_key, action, description")
    .order("module_key", { ascending: true });

  if (error) {
    return {
      mode: "supabase" as const,
      rows: [] as PermissionListItem[],
      error: error.message,
    };
  }

  return {
    mode: "supabase" as const,
    rows: ((data ?? []) as PermissionRow[]).map((permission) => ({
      id: permission.id,
      key: permission.key,
      moduleKey: permission.module_key,
      action: permission.action,
      description: permission.description,
    })),
    error: null,
  };
}

export async function listRoles(businessId?: string | null) {
  if (!isSupabaseConfigured()) {
    return {
      mode: "demo" as const,
      rows: demoRoles.map((role) => ({
        id: role.id,
        key: role.key,
        name: role.name,
        scope: role.scope,
        users: role.users,
        permissionsCount: role.permissionsCount,
        permissionKeys: role.permissionKeys,
        isSystem: role.key === "owner" || role.key === "admin" || role.key === "manager" || role.key === "staff",
        source: "demo" as const,
      })),
      permissions: demoPermissions,
      error: null,
    };
  }

  if (!businessId) {
    return {
      mode: "supabase" as const,
      rows: [] as RoleListItem[],
      permissions: [] as PermissionListItem[],
      error: null,
    };
  }

  const client = getSupabaseBrowserClient();

  if (!client) {
    return {
      mode: "demo" as const,
      rows: [] as RoleListItem[],
      permissions: demoPermissions,
      error: null,
    };
  }

  const [{ data: roles, error }, permissionsResult, { data: memberships }, { data: rolePermissions }] = await Promise.all([
    client
      .from("roles")
      .select("id, key, name, description, is_system, business_id")
      .or(`business_id.eq.${businessId},business_id.is.null`)
      .order("is_system", { ascending: false })
      .order("name", { ascending: true }),
    listPermissions(),
    client
      .from("business_memberships")
      .select("role_id")
      .eq("business_id", businessId)
      .eq("status", "active"),
    client.from("role_permissions").select("role_id, permission_id"),
  ]);

  if (error) {
    return {
      mode: "supabase" as const,
      rows: [] as RoleListItem[],
      permissions: permissionsResult.rows,
      error: error.message,
    };
  }

  const roleRows = (roles ?? []) as RoleRow[];
  const membershipRows = (memberships ?? []) as MembershipRow[];
  const rolePermissionRows = (rolePermissions ?? []) as RolePermissionRow[];
  const roleUsage = new Map<string, number>();
  const permissionUsage = new Map<string, number>();
  const permissionKeyById = new Map(permissionsResult.rows.map((permission) => [permission.id, permission.key]));
  const permissionKeysByRoleId = new Map<string, string[]>();

  for (const membership of membershipRows) {
    roleUsage.set(membership.role_id, (roleUsage.get(membership.role_id) ?? 0) + 1);
  }

  for (const item of rolePermissionRows) {
    permissionUsage.set(item.role_id, (permissionUsage.get(item.role_id) ?? 0) + 1);

    const permissionKey = permissionKeyById.get(item.permission_id);

    if (!permissionKey) {
      continue;
    }

    permissionKeysByRoleId.set(item.role_id, [...(permissionKeysByRoleId.get(item.role_id) ?? []), permissionKey]);
  }

  return {
    mode: "supabase" as const,
    rows: roleRows.map((role) => ({
      id: role.id,
      key: role.key,
      name: role.name,
      scope: role.description ?? role.key,
      users: roleUsage.get(role.id) ?? 0,
      permissionsCount: permissionUsage.get(role.id) ?? 0,
      permissionKeys: permissionKeysByRoleId.get(role.id) ?? [],
      isSystem: role.is_system,
      source: "supabase" as const,
    })),
    permissions: permissionsResult.rows,
    error: permissionsResult.error,
  };
}

export async function createRole(businessId: string | null | undefined, input: CreateRoleInput) {
  if (!isSupabaseConfigured() || !businessId) {
    return { error: null };
  }

  const client = getSupabaseBrowserClient();

  if (!client) {
    return { error: "No se pudo inicializar el cliente de Supabase." };
  }

  const normalizedKey = slugifyKey(input.key || input.name);
  const { data: role, error } = await client
    .from("roles")
    .insert({
      business_id: businessId,
      key: normalizedKey,
      name: input.name,
      description: input.description ?? null,
      is_system: false,
    })
    .select("id")
    .single();

  if (error || !role) {
    return { error: error?.message ?? "No se pudo crear el rol." };
  }

  if (input.permissionKeys.length === 0) {
    return { error: null };
  }

  const { data: permissions, error: permissionError } = await client
    .from("permissions")
    .select("id, key")
    .in("key", input.permissionKeys);

  if (permissionError) {
    return { error: permissionError.message };
  }

  const permissionIds = (permissions ?? []).map((permission) => permission.id);

  if (permissionIds.length === 0) {
    return { error: null };
  }

  const { error: assignmentError } = await client.from("role_permissions").insert(
    permissionIds.map((permissionId) => ({
      role_id: role.id,
      permission_id: permissionId,
    })),
  );

  return { error: assignmentError?.message ?? null };
}

export async function updateRolePermissions(roleId: string, permissionKeys: string[]) {
  if (!isSupabaseConfigured()) {
    return { error: null };
  }

  const client = getSupabaseBrowserClient();

  if (!client) {
    return { error: "No se pudo inicializar el cliente de Supabase." };
  }

  const { data: role, error: roleError } = await client
    .from("roles")
    .select("id, is_system")
    .eq("id", roleId)
    .maybeSingle();

  if (roleError) {
    return { error: roleError.message };
  }

  if (!role) {
    return { error: "No se encontro el rol seleccionado." };
  }

  if (role.is_system) {
    return { error: "Los roles de sistema son de solo lectura." };
  }

  const { error: deleteError } = await client.from("role_permissions").delete().eq("role_id", roleId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  if (permissionKeys.length === 0) {
    return { error: null };
  }

  const { data: permissions, error: permissionError } = await client
    .from("permissions")
    .select("id, key")
    .in("key", permissionKeys);

  if (permissionError) {
    return { error: permissionError.message };
  }

  const permissionIds = (permissions ?? []).map((permission) => permission.id);

  if (permissionIds.length === 0) {
    return { error: null };
  }

  const { error: insertError } = await client.from("role_permissions").insert(
    permissionIds.map((permissionId) => ({
      role_id: roleId,
      permission_id: permissionId,
    })),
  );

  return { error: insertError?.message ?? null };
}
