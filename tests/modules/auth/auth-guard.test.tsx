// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { useAuthMock, usePathnameMock, useRouterMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  usePathnameMock: vi.fn(),
  useRouterMock: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: useAuthMock,
}));

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
  useRouter: useRouterMock,
}));

import { AuthGuard } from "@/modules/auth/components/auth-guard";

afterEach(() => {
  cleanup();
});

describe("AuthGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePathnameMock.mockReturnValue("/users");
    useRouterMock.mockReturnValue({
      replace: vi.fn(),
    });
  });

  it("renders children immediately when Supabase is disabled", () => {
    useAuthMock.mockReturnValue({
      status: "demo",
      supabaseEnabled: false,
      workspace: null,
    });

    render(
      <AuthGuard>
        <div>contenido privado</div>
      </AuthGuard>,
    );

    expect(screen.getByText("contenido privado")).toBeTruthy();
  });

  it("redirects unauthenticated users to login preserving the next path", async () => {
    const router = { replace: vi.fn() };
    useRouterMock.mockReturnValue(router);
    useAuthMock.mockReturnValue({
      status: "unauthenticated",
      supabaseEnabled: true,
      workspace: null,
    });

    render(
      <AuthGuard>
        <div>contenido privado</div>
      </AuthGuard>,
    );

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith("/auth/login?next=%2Fusers");
    });
  });

  it("redirects authenticated users without workspace to onboarding", async () => {
    const router = { replace: vi.fn() };
    useRouterMock.mockReturnValue(router);
    useAuthMock.mockReturnValue({
      status: "authenticated",
      supabaseEnabled: true,
      workspace: null,
    });

    render(
      <AuthGuard>
        <div>contenido privado</div>
      </AuthGuard>,
    );

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith("/onboarding");
    });
  });

  it("renders children when the user is authenticated and has a workspace", () => {
    useAuthMock.mockReturnValue({
      status: "authenticated",
      supabaseEnabled: true,
      workspace: {
        businessId: "biz_1",
      },
    });

    render(
      <AuthGuard>
        <div>contenido privado</div>
      </AuthGuard>,
    );

    expect(screen.getByText("contenido privado")).toBeTruthy();
  });
});
