import type { Session } from "@supabase/supabase-js";

import { businessConfig } from "@/config/business";
import { demoSession } from "@/lib/auth/session";
import type { SupabaseBrowserClient } from "@/lib/supabase/client";
import { getWorkspacePermissions } from "@/services/api/permission-service";
import { mapBusinessRowsToConfig } from "@/services/mappers/business-mapper";
import { mapSessionToAuthUser } from "@/services/mappers/profile-mapper";
import type { Database } from "@/types/database";
import type { ActiveWorkspace, WorkspaceBundle, WorkspaceSummary } from "@/types/workspace";

type SupabaseWorkspace = ActiveWorkspace & {
  mode: "supabase";
};

type BusinessUpdateInput = {
  name: string;
  email: string;
  phone: string;
  address: string;
  welcomeMessage: string;
};

type ModulesUpdateInput = {
  modules: string[];
};

type BrandingUpdateInput = {
  primaryColor: string;
  primaryForegroundColor: string;
  accentColor: string;
  accentForegroundColor: string;
  sidebarColor: string;
  fontFamily: string;
  logoUrl: string;
  heroImageUrl: string;
};

type MembershipRow = Pick<
  Database["public"]["Tables"]["business_memberships"]["Row"],
  "id" | "business_id" | "role_id" | "status" | "created_at"
>;

type BusinessRow = Database["public"]["Tables"]["businesses"]["Row"];
type BrandingRow = Database["public"]["Tables"]["business_branding"]["Row"];
type SettingsRow = Database["public"]["Tables"]["business_settings"]["Row"];
type RoleRow = Database["public"]["Tables"]["roles"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"] | null;

function getDemoWorkspaceSummary(): WorkspaceSummary {
  return {
    mode: "demo",
    membershipId: "membership_demo",
    businessId: businessConfig.id,
    businessName: businessConfig.name,
    logoText: businessConfig.branding.logoText,
    role: {
      id: "role_owner",
      key: "owner",
      name: "Owner",
    },
  };
}

export function getDemoWorkspace(): ActiveWorkspace {
  return {
    mode: "demo",
    membershipId: "membership_demo",
    businessId: businessConfig.id,
    role: {
      id: "role_owner",
      key: "owner",
      name: "Owner",
    },
    user: demoSession.user,
    business: businessConfig,
    permissions: ["manage_all", "view_reports", "manage_branding", "manage_settings", "manage_users", "manage_roles"],
  };
}

export function getDemoWorkspaceBundle(): WorkspaceBundle {
  return {
    workspace: getDemoWorkspace(),
    workspaces: [getDemoWorkspaceSummary()],
  };
}

function chooseActiveWorkspace(workspaces: ActiveWorkspace[], preferredBusinessId?: string | null) {
  if (workspaces.length === 0) {
    return null;
  }

  if (preferredBusinessId) {
    const preferred = workspaces.find((workspace) => workspace.businessId === preferredBusinessId);

    if (preferred) {
      return preferred;
    }
  }

  return workspaces[0];
}

export async function getWorkspaceBundle(
  client: SupabaseBrowserClient,
  session: Session,
  preferredBusinessId?: string | null,
): Promise<WorkspaceBundle> {
  const { data: memberships, error: membershipError } = await client
    .from("business_memberships")
    .select("id, business_id, role_id, status, created_at")
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const activeMemberships = (memberships ?? []) as MembershipRow[];

  if (activeMemberships.length === 0) {
    return {
      workspace: null,
      workspaces: [],
    };
  }

  const businessIds = [...new Set(activeMemberships.map((membership) => membership.business_id))];
  const roleIds = [...new Set(activeMemberships.map((membership) => membership.role_id))];

  const [
    { data: businesses, error: businessError },
    { data: branding },
    { data: settings },
    { data: roles },
    { data: profile },
  ] = await Promise.all([
    client
      .from("businesses")
      .select("id, name, slug, locale, currency_code, timezone, status, created_at, updated_at")
      .in("id", businessIds),
    client
      .from("business_branding")
      .select(
        "id, business_id, logo_url, hero_image_url, primary_color, primary_foreground_color, accent_color, accent_foreground_color, sidebar_color, font_family, created_at, updated_at",
      )
      .in("business_id", businessIds),
    client
      .from("business_settings")
      .select(
        "id, business_id, contact_email, contact_phone, address, website, welcome_message, modules, hours, created_at, updated_at",
      )
      .in("business_id", businessIds),
    client
      .from("roles")
      .select("id, business_id, key, name, description, is_system, created_at, updated_at")
      .in("id", roleIds),
    client
      .from("profiles")
      .select("id, full_name, email, avatar_url, phone, preferred_business_id, created_at, updated_at")
      .eq("id", session.user.id)
      .maybeSingle(),
  ]);

  if (businessError || !businesses) {
    throw new Error(businessError?.message ?? "No se pudieron cargar los negocios activos.");
  }

  const businessMap = new Map((businesses as BusinessRow[]).map((business) => [business.id, business]));
  const brandingMap = new Map(((branding ?? []) as BrandingRow[]).map((item) => [item.business_id, item]));
  const settingsMap = new Map(((settings ?? []) as SettingsRow[]).map((item) => [item.business_id, item]));
  const roleMap = new Map(((roles ?? []) as RoleRow[]).map((role) => [role.id, role]));

  const workspaceEntries = await Promise.all(
    activeMemberships.map(async (membership) => {
      const business = businessMap.get(membership.business_id);

      if (!business) {
        return null;
      }

      const role = roleMap.get(membership.role_id);
      const user = mapSessionToAuthUser(session, (profile ?? null) as ProfileRow, role?.key);
      const permissions = await getWorkspacePermissions({
        client,
        roleId: role?.id,
        roleKey: role?.key ?? user.role,
      });

      return {
        mode: "supabase" as const,
        membershipId: membership.id,
        businessId: membership.business_id,
        role: {
          id: role?.id ?? null,
          key: role?.key ?? user.role,
          name: role?.name ?? role?.key ?? user.role,
        },
        user,
        permissions,
        business: mapBusinessRowsToConfig({
          business,
          branding: brandingMap.get(membership.business_id) ?? null,
          settings: settingsMap.get(membership.business_id) ?? null,
        }),
      };
    }),
  );

  const workspaces = workspaceEntries.filter(Boolean) as SupabaseWorkspace[];

  const workspaceSummaries: WorkspaceSummary[] = workspaces.map((workspace) => ({
    mode: workspace.mode,
    membershipId: workspace.membershipId,
    businessId: workspace.businessId,
    businessName: workspace.business.name,
    logoText: workspace.business.branding.logoText,
    role: workspace.role,
  }));

  return {
    workspace: chooseActiveWorkspace(
      workspaces,
      preferredBusinessId ?? ((profile ?? null) as ProfileRow | null)?.preferred_business_id ?? null,
    ),
    workspaces: workspaceSummaries,
  };
}

export async function getWorkspaceContext(
  client: SupabaseBrowserClient,
  session: Session,
  preferredBusinessId?: string | null,
): Promise<ActiveWorkspace | null> {
  const bundle = await getWorkspaceBundle(client, session, preferredBusinessId);
  return bundle.workspace;
}

export async function updateWorkspaceBusiness(
  client: SupabaseBrowserClient,
  businessId: string,
  values: BusinessUpdateInput,
) {
  const timestamp = new Date().toISOString();

  const { error: businessError } = await client
    .from("businesses")
    .update({
      name: values.name,
      updated_at: timestamp,
    })
    .eq("id", businessId);

  if (businessError) {
    return { error: businessError.message };
  }

  const { error: settingsError } = await client.from("business_settings").upsert(
    {
      business_id: businessId,
      contact_email: values.email,
      contact_phone: values.phone,
      address: values.address,
      welcome_message: values.welcomeMessage,
      updated_at: timestamp,
    },
    {
      onConflict: "business_id",
    },
  );

  return {
    error: settingsError?.message ?? null,
  };
}

export async function updateWorkspaceModules(
  client: SupabaseBrowserClient,
  businessId: string,
  values: ModulesUpdateInput,
) {
  const { error } = await client.from("business_settings").upsert(
    {
      business_id: businessId,
      modules: values.modules,
    },
    {
      onConflict: "business_id",
    },
  );

  return { error: error?.message ?? null };
}

export async function updateWorkspaceBranding(
  client: SupabaseBrowserClient,
  businessId: string,
  values: BrandingUpdateInput,
) {
  const { error } = await client.from("business_branding").upsert(
    {
      business_id: businessId,
      primary_color: values.primaryColor,
      primary_foreground_color: values.primaryForegroundColor,
      accent_color: values.accentColor,
      accent_foreground_color: values.accentForegroundColor,
      sidebar_color: values.sidebarColor,
      font_family: values.fontFamily,
      logo_url: values.logoUrl,
      hero_image_url: values.heroImageUrl,
    },
    {
      onConflict: "business_id",
    },
  );

  return { error: error?.message ?? null };
}

export async function setPreferredBusinessSelection(
  client: SupabaseBrowserClient,
  businessId: string | null,
) {
  const { error } = await client.rpc("set_preferred_business", {
    target_business_id: businessId,
  });

  return { error: error?.message ?? null };
}
