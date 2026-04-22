import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { demoCustomers } from "@/services/api/demo-data";
import type { CreateCustomerInput, CustomerListItem } from "@/types/customer";
import type { Database } from "@/types/database";

type CustomerQueryRow = Pick<
  Database["public"]["Tables"]["customers"]["Row"],
  "id" | "full_name" | "email" | "phone" | "notes" | "created_at"
>;

function toDemoRows(): CustomerListItem[] {
  return demoCustomers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    email: null,
    phone: customer.phone,
    notes: null,
    visits: customer.visits,
    lastVisit: customer.lastVisit,
    source: "demo",
  }));
}

export async function listCustomers(businessId?: string | null) {
  if (!isSupabaseConfigured()) {
    return {
      mode: "demo" as const,
      rows: toDemoRows(),
      error: null,
    };
  }

  if (!businessId) {
    return {
      mode: "supabase" as const,
      rows: [] as CustomerListItem[],
      error: null,
    };
  }

  const client = getSupabaseBrowserClient();

  if (!client) {
    return {
      mode: "demo" as const,
      rows: toDemoRows(),
      error: null,
    };
  }

  const { data, error } = await client
    .from("customers")
    .select("id, full_name, email, phone, notes, created_at")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      mode: "supabase" as const,
      rows: [] as CustomerListItem[],
      error: error.message,
    };
  }

  return {
    mode: "supabase" as const,
    rows: ((data ?? []) as CustomerQueryRow[]).map((customer) => ({
      id: customer.id,
      name: customer.full_name,
      email: customer.email,
      phone: customer.phone,
      notes: customer.notes,
      visits: 0,
      lastVisit: customer.created_at.slice(0, 10),
      source: "supabase" as const,
    })),
    error: null,
  };
}

export async function createCustomer(
  businessId: string | null | undefined,
  input: CreateCustomerInput,
) {
  if (!isSupabaseConfigured() || !businessId) {
    return {
      customer: {
        id: `demo_${Date.now()}`,
        name: input.fullName,
        email: input.email ?? null,
        phone: input.phone ?? null,
        notes: input.notes ?? null,
        visits: 0,
        lastVisit: new Date().toISOString().slice(0, 10),
        source: "demo" as const,
      },
      error: null,
    };
  }

  const client = getSupabaseBrowserClient();

  if (!client) {
    return {
      customer: null,
      error: "No se pudo inicializar el cliente de Supabase.",
    };
  }

  const { data, error } = await client
    .from("customers")
    .insert({
      business_id: businessId,
      full_name: input.fullName,
      email: input.email ?? null,
      phone: input.phone ?? null,
      notes: input.notes ?? null,
    })
    .select("id, full_name, email, phone, notes, created_at")
    .single();

  if (error) {
    return {
      customer: null,
      error: error.message,
    };
  }

  return {
    customer: {
      id: (data as CustomerQueryRow).id,
      name: (data as CustomerQueryRow).full_name,
      email: (data as CustomerQueryRow).email,
      phone: (data as CustomerQueryRow).phone,
      notes: (data as CustomerQueryRow).notes,
      visits: 0,
      lastVisit: (data as CustomerQueryRow).created_at.slice(0, 10),
      source: "supabase" as const,
    },
    error: null,
  };
}
