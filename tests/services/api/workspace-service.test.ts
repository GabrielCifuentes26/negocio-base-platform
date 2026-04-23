import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@supabase/supabase-js";

const { getWorkspacePermissionsMock } = vi.hoisted(() => ({
  getWorkspacePermissionsMock: vi.fn(),
}));

vi.mock("@/services/api/permission-service", () => ({
  getWorkspacePermissions: getWorkspacePermissionsMock,
}));

import { getWorkspaceBundle, setPreferredBusinessSelection } from "@/services/api/workspace-service";

function createMembershipsQuery(data: unknown, error: { message: string } | null = null) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn().mockResolvedValue({
      data,
      error,
    }),
  };

  return query;
}

function createInQuery(data: unknown, error: { message: string } | null = null) {
  return {
    select: vi.fn(() => ({
      in: vi.fn().mockResolvedValue({
        data,
        error,
      }),
    })),
  };
}

function createProfileQuery(data: unknown, error: { message: string } | null = null) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn().mockResolvedValue({
      data,
      error,
    }),
  };

  return query;
}

function createWorkspaceClient({
  memberships = [],
  businesses = [],
  branding = [],
  settings = [],
  roles = [],
  profile = null,
  membershipError = null,
  businessError = null,
}: {
  memberships?: unknown[];
  businesses?: unknown[];
  branding?: unknown[];
  settings?: unknown[];
  roles?: unknown[];
  profile?: unknown;
  membershipError?: { message: string } | null;
  businessError?: { message: string } | null;
}) {
  const rpcMock = vi.fn().mockResolvedValue({
    error: null,
  });

  return {
    from: vi.fn((table: string) => {
      switch (table) {
        case "business_memberships":
          return createMembershipsQuery(memberships, membershipError);
        case "businesses":
          return createInQuery(businesses, businessError);
        case "business_branding":
          return createInQuery(branding);
        case "business_settings":
          return createInQuery(settings);
        case "roles":
          return createInQuery(roles);
        case "profiles":
          return createProfileQuery(profile);
        default:
          throw new Error(`Tabla inesperada: ${table}`);
      }
    }),
    rpc: rpcMock,
  };
}

function createSession(userId = "user_1"): Session {
  return {
    access_token: "token",
    refresh_token: "refresh",
    expires_in: 3600,
    expires_at: 1,
    token_type: "bearer",
    user: {
      id: userId,
      app_metadata: {},
      user_metadata: {
        full_name: "Gabriel Cifuentes",
      },
      aud: "authenticated",
      created_at: "2026-04-22T00:00:00.000Z",
      email: "gabriel@example.com",
    },
  } as Session;
}

describe("workspace service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty bundle when the user has no active memberships", async () => {
    const client = createWorkspaceClient({});
    const bundle = await getWorkspaceBundle(client as never, createSession());

    expect(bundle).toEqual({
      workspace: null,
      workspaces: [],
    });
  });

  it("chooses the explicit preferred business when it exists", async () => {
    getWorkspacePermissionsMock
      .mockResolvedValueOnce(["manage_users"])
      .mockResolvedValueOnce(["view_reports"]);

    const client = createWorkspaceClient({
      memberships: [
        {
          id: "membership_1",
          business_id: "biz_1",
          role_id: "role_admin",
          status: "active",
          created_at: "2026-04-20T00:00:00.000Z",
        },
        {
          id: "membership_2",
          business_id: "biz_2",
          role_id: "role_manager",
          status: "active",
          created_at: "2026-04-21T00:00:00.000Z",
        },
      ],
      businesses: [
        {
          id: "biz_1",
          name: "Salon Norte",
          slug: "salon-norte",
          locale: "es-GT",
          currency_code: "GTQ",
          timezone: "America/Guatemala",
          status: "active",
          created_at: "2026-04-20T00:00:00.000Z",
          updated_at: "2026-04-20T00:00:00.000Z",
        },
        {
          id: "biz_2",
          name: "Clinica Sur",
          slug: "clinica-sur",
          locale: "es-MX",
          currency_code: "USD",
          timezone: "America/Mexico_City",
          status: "active",
          created_at: "2026-04-21T00:00:00.000Z",
          updated_at: "2026-04-21T00:00:00.000Z",
        },
      ],
      branding: [
        {
          id: "branding_1",
          business_id: "biz_1",
          logo_url: null,
          hero_image_url: null,
          primary_color: "#111111",
          primary_foreground_color: "#ffffff",
          accent_color: "#eeeeee",
          accent_foreground_color: "#111111",
          sidebar_color: "#ffffff",
          font_family: "DM Sans",
          created_at: "2026-04-20T00:00:00.000Z",
          updated_at: "2026-04-20T00:00:00.000Z",
        },
        {
          id: "branding_2",
          business_id: "biz_2",
          logo_url: null,
          hero_image_url: null,
          primary_color: "#123456",
          primary_foreground_color: "#ffffff",
          accent_color: "#fef3c7",
          accent_foreground_color: "#111111",
          sidebar_color: "#ffffff",
          font_family: "Outfit",
          created_at: "2026-04-21T00:00:00.000Z",
          updated_at: "2026-04-21T00:00:00.000Z",
        },
      ],
      settings: [
        {
          id: "settings_1",
          business_id: "biz_1",
          contact_email: "hola@salon.com",
          contact_phone: "+502 1111 1111",
          address: "Zona norte",
          website: null,
          welcome_message: "Bienvenido",
          modules: ["dashboard", "users"],
          hours: [],
          created_at: "2026-04-20T00:00:00.000Z",
          updated_at: "2026-04-20T00:00:00.000Z",
        },
        {
          id: "settings_2",
          business_id: "biz_2",
          contact_email: "hola@clinica.com",
          contact_phone: "+52 5555 0000",
          address: "Zona sur",
          website: null,
          welcome_message: "Hola",
          modules: ["dashboard", "reports"],
          hours: [],
          created_at: "2026-04-21T00:00:00.000Z",
          updated_at: "2026-04-21T00:00:00.000Z",
        },
      ],
      roles: [
        {
          id: "role_admin",
          business_id: null,
          key: "admin",
          name: "Admin",
          description: null,
          is_system: true,
          created_at: "2026-04-20T00:00:00.000Z",
          updated_at: "2026-04-20T00:00:00.000Z",
        },
        {
          id: "role_manager",
          business_id: null,
          key: "manager",
          name: "Manager",
          description: null,
          is_system: true,
          created_at: "2026-04-21T00:00:00.000Z",
          updated_at: "2026-04-21T00:00:00.000Z",
        },
      ],
      profile: {
        id: "user_1",
        full_name: "Gabriel Cifuentes",
        email: "gabriel@example.com",
        avatar_url: null,
        phone: null,
        preferred_business_id: "biz_1",
        created_at: "2026-04-20T00:00:00.000Z",
        updated_at: "2026-04-20T00:00:00.000Z",
      },
    });

    const bundle = await getWorkspaceBundle(client as never, createSession(), "biz_2");

    expect(bundle.workspace?.businessId).toBe("biz_2");
    expect(bundle.workspaces.map((workspace) => workspace.businessId)).toEqual(["biz_1", "biz_2"]);
    expect(getWorkspacePermissionsMock).toHaveBeenCalledTimes(2);
  });

  it("falls back to the profile preferred business when no explicit selection exists", async () => {
    getWorkspacePermissionsMock.mockResolvedValue(["manage_roles"]);

    const client = createWorkspaceClient({
      memberships: [
        {
          id: "membership_1",
          business_id: "biz_1",
          role_id: "role_admin",
          status: "active",
          created_at: "2026-04-20T00:00:00.000Z",
        },
        {
          id: "membership_2",
          business_id: "biz_2",
          role_id: "role_admin",
          status: "active",
          created_at: "2026-04-21T00:00:00.000Z",
        },
      ],
      businesses: [
        {
          id: "biz_1",
          name: "Negocio Uno",
          slug: "negocio-uno",
          locale: "es-GT",
          currency_code: "GTQ",
          timezone: "America/Guatemala",
          status: "active",
          created_at: "2026-04-20T00:00:00.000Z",
          updated_at: "2026-04-20T00:00:00.000Z",
        },
        {
          id: "biz_2",
          name: "Negocio Dos",
          slug: "negocio-dos",
          locale: "es-GT",
          currency_code: "GTQ",
          timezone: "America/Guatemala",
          status: "active",
          created_at: "2026-04-21T00:00:00.000Z",
          updated_at: "2026-04-21T00:00:00.000Z",
        },
      ],
      roles: [
        {
          id: "role_admin",
          business_id: null,
          key: "admin",
          name: "Admin",
          description: null,
          is_system: true,
          created_at: "2026-04-20T00:00:00.000Z",
          updated_at: "2026-04-20T00:00:00.000Z",
        },
      ],
      profile: {
        id: "user_1",
        full_name: "Gabriel Cifuentes",
        email: "gabriel@example.com",
        avatar_url: null,
        phone: null,
        preferred_business_id: "biz_2",
        created_at: "2026-04-20T00:00:00.000Z",
        updated_at: "2026-04-20T00:00:00.000Z",
      },
    });

    const bundle = await getWorkspaceBundle(client as never, createSession());

    expect(bundle.workspace?.businessId).toBe("biz_2");
  });

  it("surfaces RPC errors when persisting the preferred business fails", async () => {
    const client = {
      rpc: vi.fn().mockResolvedValue({
        error: {
          message: "No fue posible guardar la preferencia.",
        },
      }),
    };

    const result = await setPreferredBusinessSelection(client as never, "biz_9");

    expect(client.rpc).toHaveBeenCalledWith("set_preferred_business", {
      target_business_id: "biz_9",
    });
    expect(result).toEqual({
      error: "No fue posible guardar la preferencia.",
    });
  });
});
