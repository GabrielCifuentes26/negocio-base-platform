"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { getDashboardSnapshot } from "@/services/api/dashboard-service";
import type { DashboardSnapshot } from "@/types/dashboard";

const emptySnapshot: DashboardSnapshot = {
  mode: "demo",
  metrics: {
    revenue: 0,
    appointmentsToday: 0,
    activeCustomers: 0,
    conversionRate: 0,
  },
  appointments: [],
  sales: [],
  trend: [],
  error: null,
};

export function useDashboard() {
  const { workspace, supabaseEnabled, status } = useAuth();
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(emptySnapshot);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (supabaseEnabled && status === "loading") {
      return;
    }

    let isActive = true;

    void getDashboardSnapshot(workspace?.businessId).then((result) => {
      if (!isActive) {
        return;
      }

      setSnapshot(result);
      setLoading(false);
    });

    return () => {
      isActive = false;
    };
  }, [status, supabaseEnabled, workspace?.businessId]);

  return { snapshot, loading };
}
