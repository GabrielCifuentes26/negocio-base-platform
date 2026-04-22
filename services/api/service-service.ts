import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { demoServices } from "@/services/api/demo-data";
import type { Database } from "@/types/database";
import type { CreateServiceInput, ServiceListItem } from "@/types/service";

type ServiceRow = Pick<
  Database["public"]["Tables"]["services"]["Row"],
  "id" | "name" | "price" | "duration_minutes" | "is_active"
>;

function toDemoRows(): ServiceListItem[] {
  return demoServices.map((service) => ({
    id: service.id,
    name: service.name,
    price: service.price,
    durationMinutes: Number.parseInt(service.duration, 10),
    status: service.status,
    source: "demo" as const,
  }));
}

export async function listServices(businessId?: string | null) {
  if (!isSupabaseConfigured()) {
    return { mode: "demo" as const, rows: toDemoRows(), error: null };
  }

  if (!businessId) {
    return { mode: "supabase" as const, rows: [] as ServiceListItem[], error: null };
  }

  const client = getSupabaseBrowserClient();

  if (!client) {
    return { mode: "demo" as const, rows: toDemoRows(), error: null };
  }

  const { data, error } = await client
    .from("services")
    .select("id, name, price, duration_minutes, is_active")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return { mode: "supabase" as const, rows: [] as ServiceListItem[], error: error.message };
  }

  return {
    mode: "supabase" as const,
    rows: ((data ?? []) as ServiceRow[]).map((service) => ({
      id: service.id,
      name: service.name,
      price: service.price,
      durationMinutes: service.duration_minutes,
      status: service.is_active ? "Active" : "Inactive",
      source: "supabase" as const,
    })),
    error: null,
  };
}

export async function createService(businessId: string | null | undefined, input: CreateServiceInput) {
  if (!isSupabaseConfigured() || !businessId) {
    return { error: null };
  }

  const client = getSupabaseBrowserClient();

  if (!client) {
    return { error: "No se pudo inicializar el cliente de Supabase." };
  }

  const { error } = await client.from("services").insert({
    business_id: businessId,
    name: input.name,
    description: input.description ?? null,
    duration_minutes: input.durationMinutes,
    price: input.price,
    is_active: true,
  });

  return { error: error?.message ?? null };
}
