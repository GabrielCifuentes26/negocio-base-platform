import { addDays } from "date-fns";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured, supabaseEnv } from "@/lib/supabase/env";
import type { AcceptInvitationResult, CreateInvitationInput, InvitationListItem } from "@/types/invitation";
import type { Database } from "@/types/database";

type InvitationRow = Pick<
  Database["public"]["Tables"]["business_invitations"]["Row"],
  "id" | "email" | "full_name" | "role_id" | "invite_token" | "status" | "expires_at" | "created_at"
>;

type RoleRow = Pick<Database["public"]["Tables"]["roles"]["Row"], "id" | "name">;
type BusinessRow = Pick<Database["public"]["Tables"]["businesses"]["Row"], "name">;

function generateInvitationToken() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replaceAll("-", "");
  }

  return `${Date.now()}${Math.random().toString(16).slice(2)}`;
}

export function buildInvitationLink(inviteToken: string) {
  const path = `${supabaseEnv.basePath}/auth/accept-invitation/?invite=${encodeURIComponent(inviteToken)}`;

  if (typeof window === "undefined") {
    return path;
  }

  return `${window.location.origin}${path}`;
}

export async function listInvitations(businessId?: string | null) {
  if (!isSupabaseConfigured()) {
    return {
      mode: "demo" as const,
      rows: [] as InvitationListItem[],
      error: null,
    };
  }

  if (!businessId) {
    return {
      mode: "supabase" as const,
      rows: [] as InvitationListItem[],
      error: null,
    };
  }

  const client = getSupabaseBrowserClient();

  if (!client) {
    return {
      mode: "demo" as const,
      rows: [] as InvitationListItem[],
      error: null,
    };
  }

  const [{ data, error }, { data: roles }] = await Promise.all([
    client
      .from("business_invitations")
      .select("id, email, full_name, role_id, invite_token, status, expires_at, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false }),
    client
      .from("roles")
      .select("id, name")
      .or(`business_id.eq.${businessId},business_id.is.null`),
  ]);

  if (error) {
    return {
      mode: "supabase" as const,
      rows: [] as InvitationListItem[],
      error: error.message,
    };
  }

  const roleMap = new Map(((roles ?? []) as RoleRow[]).map((role) => [role.id, role.name]));

  return {
    mode: "supabase" as const,
    rows: ((data ?? []) as InvitationRow[]).map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      fullName: invitation.full_name,
      roleId: invitation.role_id,
      roleName: roleMap.get(invitation.role_id) ?? "Rol",
      inviteToken: invitation.invite_token,
      inviteLink: buildInvitationLink(invitation.invite_token),
      status: invitation.status,
      expiresAt: invitation.expires_at,
      createdAt: invitation.created_at,
      source: "supabase" as const,
    })),
    error: null,
  };
}

export async function createInvitation(
  businessId: string | null | undefined,
  invitedByMembershipId: string | null | undefined,
  input: CreateInvitationInput,
) {
  if (!isSupabaseConfigured() || !businessId) {
    return { error: null, inviteLink: null as string | null, emailDeliveryError: null as string | null };
  }

  const client = getSupabaseBrowserClient();

  if (!client) {
    return {
      error: "No se pudo inicializar el cliente de Supabase.",
      inviteLink: null as string | null,
      emailDeliveryError: null as string | null,
    };
  }

  const inviteToken = generateInvitationToken();
  const normalizedEmail = input.email.trim().toLowerCase();
  const inviteLink = buildInvitationLink(inviteToken);

  const [{ data: role }, { data: business }] = await Promise.all([
    client.from("roles").select("id, name").eq("id", input.roleId).maybeSingle(),
    client.from("businesses").select("name").eq("id", businessId).maybeSingle(),
  ]);

  const { error } = await client.from("business_invitations").insert({
    business_id: businessId,
    email: normalizedEmail,
    full_name: input.fullName ?? null,
    role_id: input.roleId,
    invite_token: inviteToken,
    invited_by_membership_id: invitedByMembershipId ?? null,
    status: "pending",
    expires_at: addDays(new Date(), 7).toISOString(),
    notes: input.notes ?? null,
  });

  if (error) {
    return { error: error.message, inviteLink: null as string | null, emailDeliveryError: null as string | null };
  }

  let emailDeliveryError: string | null = null;

  if (supabaseEnv.invitationEmailsEnabled) {
    const { error: deliveryError } = await client.functions.invoke("send-business-invitation", {
      body: {
        inviteLink,
        email: normalizedEmail,
        fullName: input.fullName ?? null,
        roleName: (role as RoleRow | null)?.name ?? "Miembro",
        businessName: (business as BusinessRow | null)?.name ?? "Tu negocio",
      },
    });

    emailDeliveryError = deliveryError?.message ?? null;
  }

  return {
    error: null,
    inviteLink,
    emailDeliveryError,
  };
}

export async function cancelInvitation(invitationId: string) {
  if (!isSupabaseConfigured()) {
    return { error: null };
  }

  const client = getSupabaseBrowserClient();

  if (!client) {
    return { error: "No se pudo inicializar el cliente de Supabase." };
  }

  const { error } = await client
    .from("business_invitations")
    .update({
      status: "cancelled",
    })
    .eq("id", invitationId);

  return { error: error?.message ?? null };
}

export async function acceptInvitation(inviteToken: string): Promise<AcceptInvitationResult> {
  if (!isSupabaseConfigured()) {
    return { businessId: null, membershipId: null, error: "La aceptacion real requiere Supabase configurado." };
  }

  const client = getSupabaseBrowserClient();

  if (!client) {
    return { businessId: null, membershipId: null, error: "No se pudo inicializar el cliente de Supabase." };
  }

  const { data, error } = await client.rpc("accept_business_invitation", {
    invitation_token: inviteToken,
  });

  if (error) {
    return { businessId: null, membershipId: null, error: error.message };
  }

  const row = Array.isArray(data) ? data[0] : null;

  return {
    businessId: row?.business_id ?? null,
    membershipId: row?.membership_id ?? null,
    error: null,
  };
}
