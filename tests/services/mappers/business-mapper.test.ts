import { describe, expect, it } from "vitest";

import { businessConfig } from "@/config/business";
import { mapBusinessRowsToConfig } from "@/services/mappers/business-mapper";

describe("mapBusinessRowsToConfig", () => {
  it("hydrates business data from Supabase rows", () => {
    const mapped = mapBusinessRowsToConfig({
      business: {
        id: "biz_real",
        name: "Clinica Central",
        slug: "clinica-central",
        locale: "es-MX",
        currency_code: "USD",
        timezone: "America/Mexico_City",
        status: "active",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
      branding: {
        id: "brand_01",
        business_id: "biz_real",
        logo_url: "https://cdn.example.com/logo.png",
        hero_image_url: "https://cdn.example.com/hero.png",
        primary_color: "#123456",
        primary_foreground_color: "#ffffff",
        accent_color: "#fef3c7",
        accent_foreground_color: "#111111",
        sidebar_color: "#eeeeee",
        font_family: "DM Sans",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
      settings: {
        id: "settings_01",
        business_id: "biz_real",
        contact_email: "hola@clinica.com",
        contact_phone: "+52 5555 0000",
        address: "Zona central",
        website: "https://clinica.com",
        welcome_message: "Bienvenido a tu espacio clinico.",
        modules: ["dashboard", "customers", "appointments", "reports"],
        hours: [
          { day: "Lunes", opensAt: "08:00", closesAt: "18:00", enabled: true },
          { day: "Domingo", opensAt: "00:00", closesAt: "00:00", enabled: false },
        ],
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    });

    expect(mapped.id).toBe("biz_real");
    expect(mapped.name).toBe("Clinica Central");
    expect(mapped.currency.code).toBe("USD");
    expect(mapped.currency.symbol).toBe("USD");
    expect(mapped.branding.colors.primary).toBe("#123456");
    expect(mapped.branding.images.logo).toBe("https://cdn.example.com/logo.png");
    expect(mapped.modules).toEqual(["dashboard", "customers", "appointments", "reports"]);
    expect(mapped.hours).toHaveLength(2);
  });

  it("falls back to default modules and hours when settings values are invalid", () => {
    const mapped = mapBusinessRowsToConfig({
      business: null,
      branding: null,
      settings: {
        id: "settings_invalid",
        business_id: "biz_demo",
        contact_email: null,
        contact_phone: null,
        address: null,
        website: null,
        welcome_message: null,
        modules: { invalid: true },
        hours: ["bad-data"],
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    });

    expect(mapped.modules).toEqual(businessConfig.modules);
    expect(mapped.hours).toEqual(businessConfig.hours);
    expect(mapped.name).toBe(businessConfig.name);
  });
});
