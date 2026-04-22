import { formatDate, humanizeStatus } from "@/lib/format";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { demoSales } from "@/services/api/demo-data";
import { listCustomers } from "@/services/api/customer-service";
import type { CreateSaleInput, SaleFormOptions, SaleListItem } from "@/types/sale";
import type { Database } from "@/types/database";

type SaleRow = Pick<
  Database["public"]["Tables"]["sales"]["Row"],
  "id" | "ticket_number" | "customer_id" | "total" | "status" | "created_at"
>;

function toDemoRows(): SaleListItem[] {
  return demoSales.map((sale) => ({
    id: sale.id,
    ticket: sale.ticket,
    customer: sale.customer,
    total: sale.total,
    status: sale.status,
    createdAt: new Date().toISOString(),
    source: "demo" as const,
  }));
}

export async function listSaleOptions(businessId?: string | null): Promise<SaleFormOptions> {
  const customers = await listCustomers(businessId);

  return {
    customers: customers.rows.map((customer) => ({
      value: customer.id,
      label: customer.name,
      description: customer.phone ?? undefined,
    })),
  };
}

export async function listSales(businessId?: string | null) {
  if (!isSupabaseConfigured()) {
    return { mode: "demo" as const, rows: toDemoRows(), error: null };
  }

  if (!businessId) {
    return { mode: "supabase" as const, rows: [] as SaleListItem[], error: null };
  }

  const client = getSupabaseBrowserClient();

  if (!client) {
    return { mode: "demo" as const, rows: toDemoRows(), error: null };
  }

  const [{ data, error }, customerOptions] = await Promise.all([
    client
      .from("sales")
      .select("id, ticket_number, customer_id, total, status, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false }),
    listSaleOptions(businessId),
  ]);

  if (error) {
    return { mode: "supabase" as const, rows: [] as SaleListItem[], error: error.message };
  }

  const customerMap = new Map(customerOptions.customers.map((item) => [item.value, item.label]));

  return {
    mode: "supabase" as const,
    rows: ((data ?? []) as SaleRow[]).map((sale) => ({
      id: sale.id,
      ticket: sale.ticket_number,
      customer: sale.customer_id ? customerMap.get(sale.customer_id) ?? "Cliente" : "Mostrador",
      total: sale.total,
      status: humanizeStatus(sale.status),
      createdAt: sale.created_at,
      source: "supabase" as const,
    })),
    error: null,
  };
}

function createTicketNumber() {
  return `TK-${Date.now().toString().slice(-8)}`;
}

export async function createSale(
  businessId: string | null | undefined,
  membershipId: string | null | undefined,
  input: CreateSaleInput,
) {
  if (!isSupabaseConfigured() || !businessId) {
    return { error: null };
  }

  const client = getSupabaseBrowserClient();

  if (!client) {
    return { error: "No se pudo inicializar el cliente de Supabase." };
  }

  const { error } = await client.from("sales").insert({
    business_id: businessId,
    customer_id: input.customerId ?? null,
    sold_by_membership_id: membershipId ?? null,
    ticket_number: createTicketNumber(),
    status: input.status ?? "paid",
    subtotal: input.total,
    discount_total: 0,
    tax_total: 0,
    total: input.total,
    payment_method: input.paymentMethod ?? "cash",
  });

  return { error: error?.message ?? null };
}

export function formatSaleDate(value: string) {
  return formatDate(value, "dd/MM/yyyy");
}
