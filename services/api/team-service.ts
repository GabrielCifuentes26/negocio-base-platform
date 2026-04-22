import { formatDate, humanizeStatus } from "@/lib/format";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { demoUsers } from "@/services/api/demo-data";
import type { Database } from "@/types/database";
import type { SelectOption } from "@/types/options";
import type { TeamMemberListItem } from "@/types/team";

type MembershipRow = Pick<
  Database["public"]["Tables"]["business_memberships"]["Row"],
  "id" | "user_id" | "role_id" | "status" | "created_at"
>;

type ProfileRow = Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name" | "email">;
type RoleRow = Pick<Database["public"]["Tables"]["roles"]["Row"], "id" | "name">;

function toDemoUserRows(): TeamMemberListItem[] {
  return demoUsers.map((user) => ({
    id: user.id,
    membershipId: user.id,
    roleId: user.role,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    joinedAt: new Date().toISOString(),
    source: "demo" as const,
  }));
}

async function fetchWorkspaceMembers(businessId?: string | null) {
  if (!businessId) {
    return {
      memberships: [] as MembershipRow[],
      profiles: [] as ProfileRow[],
      roles: [] as RoleRow[],
      error: null as string | null,
    };
  }

  const client = getSupabaseBrowserClient();

  if (!client) {
    return {
      memberships: [] as MembershipRow[],
      profiles: [] as ProfileRow[],
      roles: [] as RoleRow[],
      error: "No se pudo inicializar el cliente de Supabase.",
    };
  }

  const { data: memberships, error } = await client
    .from("business_memberships")
    .select("id, user_id, role_id, status, created_at")
    .eq("business_id", businessId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) {
    return {
      memberships: [] as MembershipRow[],
      profiles: [] as ProfileRow[],
      roles: [] as RoleRow[],
      error: error.message,
    };
  }

  const membershipRows = (memberships ?? []) as MembershipRow[];
  const userIds = [...new Set(membershipRows.map((item) => item.user_id))];
  const roleIds = [...new Set(membershipRows.map((item) => item.role_id))];

  const [{ data: profiles }, { data: roles }] = await Promise.all([
    userIds.length > 0
      ? client.from("profiles").select("id, full_name, email").in("id", userIds)
      : Promise.resolve({ data: [] as ProfileRow[], error: null }),
    roleIds.length > 0
      ? client.from("roles").select("id, name").in("id", roleIds)
      : Promise.resolve({ data: [] as RoleRow[], error: null }),
  ]);

  return {
    memberships: membershipRows,
    profiles: (profiles ?? []) as ProfileRow[],
    roles: (roles ?? []) as RoleRow[],
    error: null,
  };
}

export async function listTeamMembers(businessId?: string | null) {
  if (!isSupabaseConfigured()) {
    return {
      mode: "demo" as const,
      rows: demoUsers.map((user) => ({
        value: user.id,
        label: user.name,
        description: user.role,
      })),
      error: null,
    };
  }

  const result = await fetchWorkspaceMembers(businessId);

  if (result.error) {
    return { mode: "supabase" as const, rows: [] as SelectOption[], error: result.error };
  }

  const profileMap = new Map(result.profiles.map((profile) => [profile.id, profile.full_name]));
  const roleMap = new Map(result.roles.map((role) => [role.id, role.name]));

  return {
    mode: "supabase" as const,
    rows: result.memberships.map((membership) => ({
      value: membership.id,
      label: profileMap.get(membership.user_id) ?? "Miembro",
      description: roleMap.get(membership.role_id) ?? undefined,
    })),
    error: null,
  };
}

export async function listWorkspaceUsers(businessId?: string | null) {
  if (!isSupabaseConfigured()) {
    return {
      mode: "demo" as const,
      rows: toDemoUserRows(),
      error: null,
    };
  }

  const result = await fetchWorkspaceMembers(businessId);

  if (result.error) {
    return { mode: "supabase" as const, rows: [] as TeamMemberListItem[], error: result.error };
  }

  const profileMap = new Map(result.profiles.map((profile) => [profile.id, profile]));
  const roleMap = new Map(result.roles.map((role) => [role.id, role.name]));

  return {
    mode: "supabase" as const,
    rows: result.memberships.map((membership) => {
      const profile = profileMap.get(membership.user_id);

      return {
        id: membership.id,
        membershipId: membership.id,
        roleId: membership.role_id,
        name: profile?.full_name ?? "Miembro",
        email: profile?.email ?? null,
        role: roleMap.get(membership.role_id) ?? "Sin rol",
        status: humanizeStatus(membership.status),
        joinedAt: membership.created_at,
        source: "supabase" as const,
      };
    }),
    error: null,
  };
}

export function formatJoinedAt(value: string) {
  return formatDate(value, "dd/MM/yyyy");
}

export async function updateWorkspaceMemberRole(membershipId: string, roleId: string) {
  if (!isSupabaseConfigured()) {
    return { error: null };
  }

  const client = getSupabaseBrowserClient();

  if (!client) {
    return { error: "No se pudo inicializar el cliente de Supabase." };
  }

  const { error } = await client
    .from("business_memberships")
    .update({
      role_id: roleId,
    })
    .eq("id", membershipId);

  return { error: error?.message ?? null };
}
