"use client";

import { startTransition, useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { getReportSnapshot } from "@/services/api/report-service";
import type { ReportRangeSelection, ReportSnapshot } from "@/types/report";

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
  comparison: {
    previousRangeStart: new Date().toISOString(),
    previousRangeEnd: new Date().toISOString(),
    previousMetrics: {
      revenue: 0,
      appointmentsCount: 0,
      activeCustomers: 0,
      conversionRate: 0,
    },
    metricChanges: {
      revenue: { current: 0, previous: 0, delta: 0, deltaPercent: 0, direction: "neutral" },
      appointmentsCount: { current: 0, previous: 0, delta: 0, deltaPercent: 0, direction: "neutral" },
      activeCustomers: { current: 0, previous: 0, delta: 0, deltaPercent: 0, direction: "neutral" },
      conversionRate: { current: 0, previous: 0, delta: 0, deltaPercent: 0, direction: "neutral" },
    },
  },
  appointments: [],
  sales: [],
  trend: [],
  error: null,
};

export function useReportSnapshot(selection: ReportRangeSelection) {
  const { workspace, supabaseEnabled, status } = useAuth();
  const [snapshot, setSnapshot] = useState<ReportSnapshot>(emptySnapshot);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (supabaseEnabled && status === "loading") {
      return;
    }

    let isActive = true;
    startTransition(() => {
      setLoading(true);
    });

    void getReportSnapshot(workspace?.businessId, selection).then((result) => {
      if (!isActive) {
        return;
      }

      startTransition(() => {
        setSnapshot(result);
        setLoading(false);
      });
    });

    return () => {
      isActive = false;
    };
  }, [selection, status, supabaseEnabled, workspace?.businessId]);

  return { snapshot, loading };
}
