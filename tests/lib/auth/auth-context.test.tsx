// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { businessConfig } from "@/config/business";
import { useAuth } from "@/hooks/use-auth";

const {
  clearPreferredBusinessIdMock,
  getDemoWorkspaceBundleMock,
  getSupabaseBrowserClientMock,
  getWorkspaceBundleMock,
  isSupabaseConfiguredMock,
  persistPreferredBusinessIdMock,
  readPreferredBusinessIdMock,
  setPreferredBusinessSelectionMock,
  signInWithPasswordMock,
  signOutCurrentUserMock,
} = vi.hoisted(() => ({
  clearPreferredBusinessIdMock: vi.fn(),
  getDemoWorkspaceBundleMock: vi.fn(),
  getSupabaseBrowserClientMock: vi.fn(),
  getWorkspaceBundleMock: vi.fn(),
  isSupabaseConfiguredMock: vi.fn(),
  persistPreferredBusinessIdMock: vi.fn(),
  readPreferredBusinessIdMock: vi.fn(),
  setPreferredBusinessSelectionMock: vi.fn(),
  signInWithPasswordMock: vi.fn(),
  signOutCurrentUserMock: vi.fn(),
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseConfigured: isSupabaseConfiguredMock,
}));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: getSupabaseBrowserClientMock,
}));

vi.mock("@/services/api/auth-service", () => ({
  signInWithPassword: signInWithPasswordMock,
  signOutCurrentUser: signOutCurrentUserMock,
}));

vi.mock("@/services/api/workspace-service", () => ({
  getDemoWorkspaceBundle: getDemoWorkspaceBundleMock,
  getWorkspaceBundle: getWorkspaceBundleMock,
  setPreferredBusinessSelection: setPreferredBusinessSelectionMock,
}));

vi.mock("@/lib/auth/workspace-preferences", () => ({
  clearPreferredBusinessId: clearPreferredBusinessIdMock,
  persistPreferredBusinessId: persistPreferredBusinessIdMock,
  readPreferredBusinessId: readPreferredBusinessIdMock,
}));

import { AuthProvider } from "@/lib/auth/auth-context";

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
      created_at: "2026-04-23T00:00:00.000Z",
      email: "gabriel@example.com",
    },
  } as Session;
}

function createWorkspaceBundle(businessId: string, businessName: string) {
  return {
    workspace: {
      mode: "supabase" as const,
      membershipId: `membership_${businessId}`,
      businessId,
      role: {
        id: "role_admin",
        key: "admin",
        name: "Admin",
      },
      user: {
        id: "user_1",
        email: "gabriel@example.com",
        fullName: "Gabriel Cifuentes",
        role: "admin" as const,
      },
      permissions: ["users.manage", "settings.update"],
      business: {
        ...businessConfig,
        id: businessId,
        name: businessName,
      },
    },
    workspaces: [
      {
        mode: "supabase" as const,
        membershipId: "membership_biz_1",
        businessId: "biz_1",
        businessName: "Salon Norte",
        logoText: "SN",
        role: {
          id: "role_admin",
          key: "admin",
          name: "Admin",
        },
      },
      {
        mode: "supabase" as const,
        membershipId: "membership_biz_2",
        businessId: "biz_2",
        businessName: "Clinica Sur",
        logoText: "CS",
        role: {
          id: "role_manager",
          key: "manager",
          name: "Manager",
        },
      },
    ],
  };
}

function ContextProbe() {
  const auth = useAuth();
  const [lastResult, setLastResult] = useState<string>("idle");

  return (
    <div>
      <div data-testid="status">{auth.status}</div>
      <div data-testid="error">{auth.error ?? ""}</div>
      <div data-testid="workspace">{auth.workspace?.business.name ?? ""}</div>
      <div data-testid="active-business">{auth.activeBusinessId ?? ""}</div>
      <div data-testid="last-result">{lastResult}</div>
      <button
        type="button"
        onClick={async () => {
          const result = await auth.switchWorkspace("biz_2");
          setLastResult(result.error ?? "ok");
        }}
      >
        switch-valid
      </button>
      <button
        type="button"
        onClick={async () => {
          const result = await auth.switchWorkspace("biz_missing");
          setLastResult(result.error ?? "ok");
        }}
      >
        switch-invalid
      </button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <ContextProbe />
    </AuthProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readPreferredBusinessIdMock.mockReturnValue(null);
    signOutCurrentUserMock.mockResolvedValue({ error: null });
    signInWithPasswordMock.mockResolvedValue({ error: null });
  });

  it("hydrates demo state when Supabase is disabled", async () => {
    isSupabaseConfiguredMock.mockReturnValue(false);
    getDemoWorkspaceBundleMock.mockReturnValue({
      workspace: {
        mode: "demo",
        membershipId: "membership_demo",
        businessId: "biz_demo",
        role: {
          id: "role_owner",
          key: "owner",
          name: "Owner",
        },
        user: {
          id: "user_demo",
          email: "demo@example.com",
          fullName: "Demo User",
          role: "owner",
        },
        permissions: ["manage_all"],
        business: {
          ...businessConfig,
          id: "biz_demo",
          name: "Demo Workspace",
        },
      },
      workspaces: [],
    });

    renderWithProvider();

    expect(screen.getByTestId("status").textContent).toBe("demo");
    expect(screen.getByTestId("workspace").textContent).toBe("Demo Workspace");
  });

  it("surfaces a client initialization error when Supabase is enabled but the browser client is missing", async () => {
    isSupabaseConfiguredMock.mockReturnValue(true);
    getSupabaseBrowserClientMock.mockReturnValue(null);

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("unauthenticated");
      expect(screen.getByTestId("error").textContent).toBe("No se pudo inicializar Supabase.");
    });
  });

  it("loads the workspace bundle and switches to another valid business", async () => {
    const session = createSession();
    const subscription = {
      unsubscribe: vi.fn(),
    };
    const client = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session },
          error: null,
        }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: { subscription },
        }),
      },
    };

    isSupabaseConfiguredMock.mockReturnValue(true);
    getSupabaseBrowserClientMock.mockReturnValue(client);
    getWorkspaceBundleMock
      .mockResolvedValueOnce(createWorkspaceBundle("biz_1", "Salon Norte"))
      .mockResolvedValueOnce(createWorkspaceBundle("biz_2", "Clinica Sur"));
    setPreferredBusinessSelectionMock.mockResolvedValue({ error: null });

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("authenticated");
      expect(screen.getByTestId("workspace").textContent).toBe("Salon Norte");
    });

    fireEvent.click(screen.getByText("switch-valid"));

    await waitFor(() => {
      expect(screen.getByTestId("workspace").textContent).toBe("Clinica Sur");
      expect(screen.getByTestId("active-business").textContent).toBe("biz_2");
      expect(screen.getByTestId("last-result").textContent).toBe("ok");
    });

    expect(setPreferredBusinessSelectionMock).toHaveBeenCalledWith(client, "biz_2");
    expect(persistPreferredBusinessIdMock).toHaveBeenCalledWith("biz_1");
    expect(persistPreferredBusinessIdMock).toHaveBeenCalledWith("biz_2");
  });

  it("rejects switching to a business that is not in the current workspace list", async () => {
    const session = createSession();
    const client = {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session },
          error: null,
        }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: { subscription: { unsubscribe: vi.fn() } },
        }),
      },
    };

    isSupabaseConfiguredMock.mockReturnValue(true);
    getSupabaseBrowserClientMock.mockReturnValue(client);
    getWorkspaceBundleMock.mockResolvedValue(createWorkspaceBundle("biz_1", "Salon Norte"));

    renderWithProvider();

    await waitFor(() => {
      expect(screen.getByTestId("workspace").textContent).toBe("Salon Norte");
    });

    fireEvent.click(screen.getByText("switch-invalid"));

    await waitFor(() => {
      expect(screen.getByTestId("last-result").textContent).toBe("No tienes acceso al negocio seleccionado.");
    });

    expect(setPreferredBusinessSelectionMock).not.toHaveBeenCalled();
  });
});
