"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { createCustomer, listCustomers } from "@/services/api/customer-service";
import type { CreateCustomerInput, CustomerListItem } from "@/types/customer";

export function useCustomers() {
  const { workspace, supabaseEnabled, status } = useAuth();
  const [rows, setRows] = useState<CustomerListItem[]>([]);
  const [mode, setMode] = useState<"demo" | "supabase">(supabaseEnabled ? "supabase" : "demo");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    const result = await listCustomers(workspace?.businessId);
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

    void listCustomers(workspace?.businessId).then((result) => {
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

  async function addCustomer(input: CreateCustomerInput) {
    const result = await createCustomer(workspace?.businessId, input);

    if (result.error || !result.customer) {
      return {
        error: result.error ?? "No se pudo crear el cliente.",
      };
    }

    setRows((current) => [result.customer, ...current]);
    return {
      error: null,
    };
  }

  return {
    rows,
    mode,
    loading,
    error,
    addCustomer,
    reload,
  };
}
