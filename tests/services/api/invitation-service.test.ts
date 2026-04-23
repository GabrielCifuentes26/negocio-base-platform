import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  getSupabaseBrowserClientMock,
  isSupabaseConfiguredMock,
  supabaseEnvMock,
} = vi.hoisted(() => ({
  getSupabaseBrowserClientMock: vi.fn(),
  isSupabaseConfiguredMock: vi.fn(),
  supabaseEnvMock: {
    url: "https://project.supabase.co",
    anonKey: "anon-key",
    storageBucket: "brand-assets",
    invitationEmailsEnabled: false,
    basePath: "",
  },
}));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: getSupabaseBrowserClientMock,
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseConfigured: isSupabaseConfiguredMock,
  supabaseEnv: supabaseEnvMock,
}));

import {
  acceptInvitation,
  buildInvitationLink,
  createInvitation,
  listInvitations,
} from "@/services/api/invitation-service";

function createMaybeSingleQuery<T>(result: T) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn().mockResolvedValue({
      data: result,
      error: null,
    }),
  };

  return query;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("invitation service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    supabaseEnvMock.basePath = "";
    supabaseEnvMock.invitationEmailsEnabled = false;
  });

  it("builds a relative invitation link on the server", () => {
    supabaseEnvMock.basePath = "/negocio-base-platform";

    expect(buildInvitationLink("invite_123")).toBe(
      "/negocio-base-platform/auth/accept-invitation/?invite=invite_123",
    );
  });

  it("builds an absolute invitation link in the browser", () => {
    supabaseEnvMock.basePath = "/portal";
    vi.stubGlobal("window", {
      location: {
        origin: "https://demo.example.com",
      },
    });

    expect(buildInvitationLink("invite_abc")).toBe(
      "https://demo.example.com/portal/auth/accept-invitation/?invite=invite_abc",
    );
  });

  it("creates an invitation, normalizes the email and reports delivery errors without failing the creation", async () => {
    supabaseEnvMock.basePath = "/portal";
    supabaseEnvMock.invitationEmailsEnabled = true;
    isSupabaseConfiguredMock.mockReturnValue(true);
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn().mockReturnValue("1111-2222"),
    });

    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const invokeMock = vi.fn().mockResolvedValue({
      error: {
        message: "El proveedor no respondio.",
      },
    });

    getSupabaseBrowserClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "roles") {
          return createMaybeSingleQuery({
            id: "role_manager",
            name: "Manager",
          });
        }

        if (table === "businesses") {
          return createMaybeSingleQuery({
            name: "Salon Aurora",
          });
        }

        if (table === "business_invitations") {
          return {
            insert: insertMock,
          };
        }

        throw new Error(`Tabla inesperada: ${table}`);
      }),
      functions: {
        invoke: invokeMock,
      },
    });

    const result = await createInvitation("biz_1", "membership_1", {
      email: "  TEAM@AURORA.COM ",
      fullName: "Ana Perez",
      roleId: "role_manager",
      notes: "Invitacion inicial",
    });

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        business_id: "biz_1",
        invited_by_membership_id: "membership_1",
        email: "team@aurora.com",
        full_name: "Ana Perez",
        role_id: "role_manager",
        invite_token: "11112222",
        status: "pending",
        notes: "Invitacion inicial",
      }),
    );

    expect(invokeMock).toHaveBeenCalledWith("send-business-invitation", {
      body: expect.objectContaining({
        email: "team@aurora.com",
        roleName: "Manager",
        businessName: "Salon Aurora",
        inviteLink: "/portal/auth/accept-invitation/?invite=11112222",
      }),
    });

    expect(result).toEqual({
      error: null,
      inviteLink: "/portal/auth/accept-invitation/?invite=11112222",
      emailDeliveryError: "El proveedor no respondio.",
    });
  });

  it("maps invitation rows with role names and generated links", async () => {
    supabaseEnvMock.basePath = "/portal";
    isSupabaseConfiguredMock.mockReturnValue(true);

    const invitationsQuery = {
      select: vi.fn(() => invitationsQuery),
      eq: vi.fn(() => invitationsQuery),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: "inv_1",
            email: "team@example.com",
            full_name: "Equipo",
            role_id: "role_admin",
            invite_token: "token_1",
            status: "pending",
            expires_at: "2026-04-30T00:00:00.000Z",
            created_at: "2026-04-22T00:00:00.000Z",
          },
        ],
        error: null,
      }),
    };

    const rolesQuery = {
      select: vi.fn(() => rolesQuery),
      or: vi.fn().mockResolvedValue({
        data: [{ id: "role_admin", name: "Admin" }],
        error: null,
      }),
    };

    getSupabaseBrowserClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "business_invitations") {
          return invitationsQuery;
        }

        if (table === "roles") {
          return rolesQuery;
        }

        throw new Error(`Tabla inesperada: ${table}`);
      }),
    });

    const result = await listInvitations("biz_1");

    expect(result.error).toBeNull();
    expect(result.rows).toEqual([
      {
        id: "inv_1",
        email: "team@example.com",
        fullName: "Equipo",
        roleId: "role_admin",
        roleName: "Admin",
        inviteToken: "token_1",
        inviteLink: "/portal/auth/accept-invitation/?invite=token_1",
        status: "pending",
        expiresAt: "2026-04-30T00:00:00.000Z",
        createdAt: "2026-04-22T00:00:00.000Z",
        source: "supabase",
      },
    ]);
  });

  it("accepts an invitation through the expected RPC", async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      data: [{ business_id: "biz_accepted", membership_id: "membership_accepted" }],
      error: null,
    });

    isSupabaseConfiguredMock.mockReturnValue(true);
    getSupabaseBrowserClientMock.mockReturnValue({
      rpc: rpcMock,
    });

    const result = await acceptInvitation("token_abc");

    expect(rpcMock).toHaveBeenCalledWith("accept_business_invitation", {
      invitation_token: "token_abc",
    });

    expect(result).toEqual({
      businessId: "biz_accepted",
      membershipId: "membership_accepted",
      error: null,
    });
  });
});
