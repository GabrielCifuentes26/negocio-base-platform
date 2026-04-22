"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { createService, listServices } from "@/services/api/service-service";
import type { CreateServiceInput, ServiceListItem } from "@/types/service";

export function useServices() {
  const { workspace, supabaseEnabled, status } = useAuth();
  const [rows, setRows] = useState<ServiceListItem[]>([]);
  const [mode, setMode] = useState<"demo" | "supabase">(supabaseEnabled ? "supabase" : "demo");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    const result = await listServices(workspace?.businessId);
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

    void listServices(workspace?.businessId).then((result) => {
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

  async function addService(input: CreateServiceInput) {
    const result = await createService(workspace?.businessId, input);

    if (result.error) {
      return { error: result.error };
    }

    await reload();
    return { error: null };
  }

  return { rows, mode, loading, error, addService, reload };
}
