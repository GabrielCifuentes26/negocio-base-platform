// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { useAuthMock, toastErrorMock, toastSuccessMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastSuccessMock: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: useAuthMock,
}));

vi.mock("sonner", () => ({
  toast: {
    error: toastErrorMock,
    success: toastSuccessMock,
  },
}));

import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";

afterEach(() => {
  cleanup();
});

describe("WorkspaceSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when Supabase is disabled or only one workspace exists", () => {
    useAuthMock.mockReturnValue({
      workspaces: [
        {
          businessId: "biz_1",
          businessName: "Salon Norte",
          role: { name: "Admin" },
        },
      ],
      activeBusinessId: "biz_1",
      switchWorkspace: vi.fn(),
      supabaseEnabled: false,
    });

    const { container } = render(<WorkspaceSwitcher />);

    expect(container.firstChild).toBeNull();
  });

  it("switches to another workspace and shows a success toast", async () => {
    const switchWorkspaceMock = vi.fn().mockResolvedValue({ error: null });

    useAuthMock.mockReturnValue({
      workspaces: [
        {
          businessId: "biz_1",
          businessName: "Salon Norte",
          role: { name: "Admin" },
        },
        {
          businessId: "biz_2",
          businessName: "Clinica Sur",
          role: { name: "Manager" },
        },
      ],
      activeBusinessId: "biz_1",
      switchWorkspace: switchWorkspaceMock,
      supabaseEnabled: true,
    });

    render(<WorkspaceSwitcher />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "biz_2" },
    });

    await waitFor(() => {
      expect(switchWorkspaceMock).toHaveBeenCalledWith("biz_2");
      expect(toastSuccessMock).toHaveBeenCalledWith("Negocio activo: Clinica Sur.");
    });
  });

  it("shows an error toast when the workspace switch fails", async () => {
    const switchWorkspaceMock = vi.fn().mockResolvedValue({
      error: "No fue posible cambiar el negocio.",
    });

    useAuthMock.mockReturnValue({
      workspaces: [
        {
          businessId: "biz_1",
          businessName: "Salon Norte",
          role: { name: "Admin" },
        },
        {
          businessId: "biz_2",
          businessName: "Clinica Sur",
          role: { name: "Manager" },
        },
      ],
      activeBusinessId: "biz_1",
      switchWorkspace: switchWorkspaceMock,
      supabaseEnabled: true,
    });

    render(<WorkspaceSwitcher />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "biz_2" },
    });

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith("No fue posible cambiar el negocio.");
    });
  });
});
