"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { createSale, listSaleOptions, listSales } from "@/services/api/sale-service";
import type { CreateSaleInput, SaleFormOptions, SaleListItem } from "@/types/sale";

const emptyOptions: SaleFormOptions = {
  customers: [],
};

export function useSales() {
  const { workspace, supabaseEnabled, status } = useAuth();
  const [rows, setRows] = useState<SaleListItem[]>([]);
  const [options, setOptions] = useState<SaleFormOptions>(emptyOptions);
  const [mode, setMode] = useState<"demo" | "supabase">(supabaseEnabled ? "supabase" : "demo");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    const [sales, nextOptions] = await Promise.all([
      listSales(workspace?.businessId),
      listSaleOptions(workspace?.businessId),
    ]);
    setRows(sales.rows);
    setOptions(nextOptions);
    setMode(sales.mode);
    setError(sales.error);
    setLoading(false);
  }

  useEffect(() => {
    if (supabaseEnabled && status === "loading") {
      return;
    }

    let isActive = true;

    void Promise.all([listSales(workspace?.businessId), listSaleOptions(workspace?.businessId)]).then(
      ([sales, nextOptions]) => {
        if (!isActive) {
          return;
        }

        setRows(sales.rows);
        setOptions(nextOptions);
        setMode(sales.mode);
        setError(sales.error);
        setLoading(false);
      },
    );

    return () => {
      isActive = false;
    };
  }, [status, supabaseEnabled, workspace?.businessId]);

  async function addSale(input: CreateSaleInput) {
    const result = await createSale(workspace?.businessId, workspace?.membershipId, input);

    if (result.error) {
      return { error: result.error };
    }

    await reload();
    return { error: null };
  }

  return { rows, options, mode, loading, error, addSale, reload };
}
