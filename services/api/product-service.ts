import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { demoProducts } from "@/services/api/demo-data";
import type { Database } from "@/types/database";
import type { CreateProductInput, ProductListItem } from "@/types/product";

type ProductRow = Pick<
  Database["public"]["Tables"]["products"]["Row"],
  "id" | "name" | "sku" | "stock" | "price"
>;

function toDemoRows(): ProductListItem[] {
  return demoProducts.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    stock: product.stock,
    price: product.price,
    source: "demo" as const,
  }));
}

export async function listProducts(businessId?: string | null) {
  if (!isSupabaseConfigured()) {
    return { mode: "demo" as const, rows: toDemoRows(), error: null };
  }

  if (!businessId) {
    return { mode: "supabase" as const, rows: [] as ProductListItem[], error: null };
  }

  const client = getSupabaseBrowserClient();

  if (!client) {
    return { mode: "demo" as const, rows: toDemoRows(), error: null };
  }

  const { data, error } = await client
    .from("products")
    .select("id, name, sku, stock, price")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return { mode: "supabase" as const, rows: [] as ProductListItem[], error: error.message };
  }

  return {
    mode: "supabase" as const,
    rows: ((data ?? []) as ProductRow[]).map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      stock: product.stock,
      price: product.price,
      source: "supabase" as const,
    })),
    error: null,
  };
}

export async function createProduct(businessId: string | null | undefined, input: CreateProductInput) {
  if (!isSupabaseConfigured() || !businessId) {
    return { error: null };
  }

  const client = getSupabaseBrowserClient();

  if (!client) {
    return { error: "No se pudo inicializar el cliente de Supabase." };
  }

  const { error } = await client.from("products").insert({
    business_id: businessId,
    name: input.name,
    description: input.description ?? null,
    sku: input.sku ?? null,
    stock: input.stock,
    price: input.price,
    is_active: true,
  });

  return { error: error?.message ?? null };
}
