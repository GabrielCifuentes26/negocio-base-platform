"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { createProduct, listProducts } from "@/services/api/product-service";
import type { CreateProductInput, ProductListItem } from "@/types/product";

export function useProducts() {
  const { workspace, supabaseEnabled, status } = useAuth();
  const [rows, setRows] = useState<ProductListItem[]>([]);
  const [mode, setMode] = useState<"demo" | "supabase">(supabaseEnabled ? "supabase" : "demo");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    const result = await listProducts(workspace?.businessId);
    setRows(result.rows);
    setMode(result.mode);
    setError(result.error);
    setLoading(false);
  }

  useEffect(() => {
    if (supabaseEnabled && status === "loading") {
      return;
    }

    let isActive = true;

    void listProducts(workspace?.businessId).then((result) => {
      if (!isActive) {
        return;
      }

      setRows(result.rows);
      setMode(result.mode);
      setError(result.error);
      setLoading(false);
    });

    return () => {
      isActive = false;
    };
  }, [status, supabaseEnabled, workspace?.businessId]);

  async function addProduct(input: CreateProductInput) {
    const result = await createProduct(workspace?.businessId, input);

    if (result.error) {
      return { error: result.error };
    }

    await reload();
    return { error: null };
  }

  return { rows, mode, loading, error, addProduct, reload };
}
