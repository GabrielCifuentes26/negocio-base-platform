"use client";

import { businessConfig } from "@/config/business";
import { useAuth } from "@/hooks/use-auth";

export function useBranding() {
  const { workspace } = useAuth();
  const business = workspace?.business ?? businessConfig;

  return {
    "--primary": business.branding.colors.primary,
    "--primary-foreground": business.branding.colors.primaryForeground,
    "--accent": business.branding.colors.accent,
    "--accent-foreground": business.branding.colors.accentForeground,
    "--sidebar": business.branding.colors.sidebar,
    "--sidebar-primary": business.branding.colors.primary,
    "--ring": business.branding.colors.primary,
  };
}
