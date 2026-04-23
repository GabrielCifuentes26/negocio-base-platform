"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { getReportSnapshot } from "@/services/api/report-service";
import type { ReportRangeKey, ReportSnapshot } from "@/types/report";

const emptySnapshot: ReportSnapshot = {
  mode: "demo",
  rangeKey: "30d",
  rangeDays: 30,
  rangeLabel: "30 dias",
  rangeStart: new Date().toISOString(),
  rangeEnd: new Date().toISOString(),
  metrics: {
    revenue: 0,
    appointmentsCount: 0,
    activeCustomers: 0,
    conversionRate: 0,
  },
  appointments: [],
  sales: [],
  trend: [],
  error: null,
};

export function useReportSnapshot(rangeKey: ReportRangeKey) {
  const { workspace, supabaseEnabled, status } = useAuth();
  const [snapshot, setSnapshot] = useState<ReportSnapshot>(emptySnapshot);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (supabaseEnabled && status === "loading") {
      return;
    }

    let isActive = true;

    void getReportSnapshot(workspace?.businessId, rangeKey).then((result) => {
      if (!isActive) {
        return;
      }

      setSnapshot(result);
      setLoading(false);
    });

    return () => {
      isActive = false;
    };
  }, [rangeKey, status, supabaseEnabled, workspace?.businessId]);

  return { snapshot, loading };
}
