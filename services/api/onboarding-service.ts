import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { BootstrapBusinessWorkspaceInput } from "@/types/onboarding";

export async function bootstrapBusinessWorkspace(input: BootstrapBusinessWorkspaceInput) {
  if (!isSupabaseConfigured()) {
    return {
      businessId: null as string | null,
      membershipId: null as string | null,
      error: "El onboarding real requiere Supabase configurado.",
    };
  }

  const client = getSupabaseBrowserClient();

  if (!client) {
    return {
      businessId: null as string | null,
      membershipId: null as string | null,
      error: "No se pudo inicializar el cliente de Supabase.",
    };
  }

  const { data, error } = await client.rpc("bootstrap_business_workspace", {
    business_name: input.businessName,
    contact_email: input.contactEmail,
    contact_phone: input.contactPhone,
    address: input.address,
    welcome_message: input.welcomeMessage,
    locale_value: input.locale,
    currency_code_value: input.currencyCode,
    timezone_value: input.timezone,
    active_modules: input.modules,
    primary_color: input.primaryColor,
    accent_color: input.accentColor,
    font_family: input.fontFamily,
  });

  if (error) {
    return {
      businessId: null as string | null,
      membershipId: null as string | null,
      error: error.message,
    };
  }

  const row = Array.isArray(data) ? data[0] : null;

  return {
    businessId: row?.business_id ?? null,
    membershipId: row?.membership_id ?? null,
    error: null,
  };
}
