import { businessConfig } from "@/config/business";
import type { BusinessConfig, BusinessHours } from "@/types/business";
import type { Database, Json } from "@/types/database";

type BusinessRow = Database["public"]["Tables"]["businesses"]["Row"] | null;
type BrandingRow = Database["public"]["Tables"]["business_branding"]["Row"] | null;
type SettingsRow = Database["public"]["Tables"]["business_settings"]["Row"] | null;

function readStringArray(value: Json, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value.filter((item): item is string => typeof item === "string");
  return items.length > 0 ? items : fallback;
}

function readBusinessHours(value: Json, fallback: BusinessHours[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value.filter((item): item is BusinessHours => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return false;
    }

    return (
      typeof item.day === "string" &&
      typeof item.opensAt === "string" &&
      typeof item.closesAt === "string" &&
      typeof item.enabled === "boolean"
    );
  });

  return items.length > 0 ? items : fallback;
}

export function mapBusinessRowsToConfig({
  business,
  branding,
  settings,
}: {
  business: BusinessRow;
  branding: BrandingRow;
  settings: SettingsRow;
}): BusinessConfig {
  const fallback = businessConfig;

  return {
    ...fallback,
    id: business?.id ?? fallback.id,
    name: business?.name ?? fallback.name,
    locale: business?.locale ?? fallback.locale,
    currency: {
      code: business?.currency_code ?? fallback.currency.code,
      symbol:
        business?.currency_code && business.currency_code !== fallback.currency.code
          ? business.currency_code
          : fallback.currency.symbol,
    },
    branding: {
      logoText: fallback.branding.logoText,
      colors: {
        primary: branding?.primary_color ?? fallback.branding.colors.primary,
        primaryForeground:
          branding?.primary_foreground_color ?? fallback.branding.colors.primaryForeground,
        accent: branding?.accent_color ?? fallback.branding.colors.accent,
        accentForeground:
          branding?.accent_foreground_color ?? fallback.branding.colors.accentForeground,
        sidebar: branding?.sidebar_color ?? fallback.branding.colors.sidebar,
      },
      fontFamily: branding?.font_family ?? fallback.branding.fontFamily,
      images: {
        hero: branding?.hero_image_url ?? fallback.branding.images.hero,
        logo: branding?.logo_url ?? fallback.branding.images.logo,
      },
    },
    contact: {
      email: settings?.contact_email ?? fallback.contact.email,
      phone: settings?.contact_phone ?? fallback.contact.phone,
      address: settings?.address ?? fallback.contact.address,
      website: settings?.website ?? fallback.contact.website,
    },
    modules: settings ? readStringArray(settings.modules, fallback.modules) : fallback.modules,
    texts: {
      welcomeMessage: settings?.welcome_message ?? fallback.texts.welcomeMessage,
      dashboardHeadline: fallback.texts.dashboardHeadline,
    },
    hours: settings ? readBusinessHours(settings.hours, fallback.hours) : fallback.hours,
  };
}
