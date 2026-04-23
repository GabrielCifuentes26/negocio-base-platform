import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSupabaseBrowserClientMock, isSupabaseConfiguredMock } = vi.hoisted(() => ({
  getSupabaseBrowserClientMock: vi.fn(),
  isSupabaseConfiguredMock: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: getSupabaseBrowserClientMock,
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseConfigured: isSupabaseConfiguredMock,
}));

import { bootstrapBusinessWorkspace } from "@/services/api/onboarding-service";

describe("bootstrapBusinessWorkspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a configuration error when Supabase is not enabled", async () => {
    isSupabaseConfiguredMock.mockReturnValue(false);

    const result = await bootstrapBusinessWorkspace({
      businessName: "Barberia Norte",
      contactEmail: "hola@barberia.com",
      contactPhone: "+502 0000 0000",
      address: "Zona 10",
      welcomeMessage: "Bienvenido",
      locale: "es-GT",
      currencyCode: "GTQ",
      timezone: "America/Guatemala",
      modules: ["dashboard", "customers"],
      primaryColor: "#111111",
      accentColor: "#eeeeee",
      fontFamily: "DM Sans",
    });

    expect(result).toEqual({
      businessId: null,
      membershipId: null,
      error: "El onboarding real requiere Supabase configurado.",
    });
  });

  it("returns a client initialization error when the browser client is missing", async () => {
    isSupabaseConfiguredMock.mockReturnValue(true);
    getSupabaseBrowserClientMock.mockReturnValue(null);

    const result = await bootstrapBusinessWorkspace({
      businessName: "Salon Aurora",
      contactEmail: "hola@aurora.com",
      contactPhone: "+502 1111 1111",
      address: "Centro",
      welcomeMessage: "Hola",
      locale: "es-GT",
      currencyCode: "GTQ",
      timezone: "America/Guatemala",
      modules: ["dashboard"],
      primaryColor: "#222222",
      accentColor: "#f5f5f5",
      fontFamily: "Sora",
    });

    expect(result).toEqual({
      businessId: null,
      membershipId: null,
      error: "No se pudo inicializar el cliente de Supabase.",
    });
  });

  it("maps the onboarding payload to the expected RPC parameters", async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      data: [{ business_id: "biz_1", membership_id: "mem_1" }],
      error: null,
    });

    isSupabaseConfiguredMock.mockReturnValue(true);
    getSupabaseBrowserClientMock.mockReturnValue({
      rpc: rpcMock,
    });

    const result = await bootstrapBusinessWorkspace({
      businessName: "Clinica Central",
      contactEmail: "contacto@clinica.com",
      contactPhone: "+52 5555 0000",
      address: "Zona central",
      welcomeMessage: "Bienvenido a tu portal.",
      locale: "es-MX",
      currencyCode: "USD",
      timezone: "America/Mexico_City",
      modules: ["dashboard", "appointments", "reports"],
      primaryColor: "#123456",
      accentColor: "#fef3c7",
      fontFamily: "DM Sans",
    });

    expect(rpcMock).toHaveBeenCalledWith("bootstrap_business_workspace", {
      business_name: "Clinica Central",
      contact_email: "contacto@clinica.com",
      contact_phone: "+52 5555 0000",
      address: "Zona central",
      welcome_message: "Bienvenido a tu portal.",
      locale_value: "es-MX",
      currency_code_value: "USD",
      timezone_value: "America/Mexico_City",
      active_modules: ["dashboard", "appointments", "reports"],
      primary_color: "#123456",
      accent_color: "#fef3c7",
      font_family: "DM Sans",
    });

    expect(result).toEqual({
      businessId: "biz_1",
      membershipId: "mem_1",
      error: null,
    });
  });

  it("surfaces the RPC error when onboarding bootstrap fails", async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      data: null,
      error: {
        message: "No fue posible crear el negocio.",
      },
    });

    isSupabaseConfiguredMock.mockReturnValue(true);
    getSupabaseBrowserClientMock.mockReturnValue({
      rpc: rpcMock,
    });

    const result = await bootstrapBusinessWorkspace({
      businessName: "Libreria Atlas",
      contactEmail: "hola@atlas.com",
      contactPhone: "+502 2222 2222",
      address: "Avenida principal",
      welcomeMessage: "Bienvenido",
      locale: "es-GT",
      currencyCode: "GTQ",
      timezone: "America/Guatemala",
      modules: ["dashboard", "products"],
      primaryColor: "#333333",
      accentColor: "#fafafa",
      fontFamily: "Outfit",
    });

    expect(result).toEqual({
      businessId: null,
      membershipId: null,
      error: "No fue posible crear el negocio.",
    });
  });
});
