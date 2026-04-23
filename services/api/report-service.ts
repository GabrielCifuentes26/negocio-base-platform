import { subDays } from "date-fns";

import { formatWeekdayShort } from "@/lib/format";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isMissingRpcError } from "@/lib/supabase/rpc";
import { getReportRangePreset } from "@/config/reporting";
import { demoMetrics, demoAppointments, demoSales, revenueTrend } from "@/services/api/demo-data";
import { listAppointments } from "@/services/api/appointment-service";
import { listSales } from "@/services/api/sale-service";
import type { ReportRangeKey, ReportSnapshot, ReportTrendItem } from "@/types/report";

type ReportRpcPayload = {
  rangeStart?: string;
  rangeEnd?: string;
  metrics?: {
    revenue?: number;
    appointmentsCount?: number;
    activeCustomers?: number;
    conversionRate?: number;
  } | null;
  appointments?: ReportSnapshot["appointments"];
  sales?: ReportSnapshot["sales"];
  trend?: Array<{
    date: string;
    revenue: number;
  }>;
} | null;

function isDateInsideRange(value: string, rangeStart: Date, rangeEnd: Date) {
  const date = new Date(value);
  return date >= rangeStart && date <= rangeEnd;
}

function getRangeDates(days: number) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = subDays(new Date(end), days - 1);
  start.setHours(0, 0, 0, 0);

  return { start, end };
}

function getDemoReportSnapshot(rangeKey: ReportRangeKey): ReportSnapshot {
  const preset = getReportRangePreset(rangeKey);
  const { start, end } = getRangeDates(preset.days);

  return {
    mode: "demo",
    rangeKey: preset.key,
    rangeDays: preset.days,
    rangeLabel: preset.label,
    rangeStart: start.toISOString(),
    rangeEnd: end.toISOString(),
    metrics: {
      revenue: demoMetrics.revenue,
      appointmentsCount: demoAppointments.length,
      activeCustomers: demoMetrics.activeCustomers,
      conversionRate: demoMetrics.conversionRate,
    },
    appointments: demoAppointments.slice(0, 4).map((item) => ({
      id: item.id,
      customer: item.customer,
      service: item.service,
      employee: item.employee,
      time: item.time,
      startsAt: start.toISOString(),
      status: item.status,
      source: "demo",
    })),
    sales: demoSales.slice(0, 5).map((item) => ({
      id: item.id,
      ticket: item.ticket,
      customer: item.customer,
      total: item.total,
      status: item.status,
      createdAt: end.toISOString(),
      source: "demo",
    })),
    trend: revenueTrend.map((item, index) => ({
      date: subDays(new Date(end), revenueTrend.length - 1 - index).toISOString(),
      label: item.name,
      revenue: item.revenue,
    })),
    error: null,
  };
}

async function getReportSnapshotViaTables(businessId: string, rangeKey: ReportRangeKey): Promise<ReportSnapshot> {
  const preset = getReportRangePreset(rangeKey);
  const { start, end } = getRangeDates(preset.days);

  const [appointmentsResult, salesResult] = await Promise.all([listAppointments(businessId), listSales(businessId)]);

  if (appointmentsResult.mode === "demo" || salesResult.mode === "demo") {
    return getDemoReportSnapshot(rangeKey);
  }

  const appointments = appointmentsResult.rows.filter((item) => isDateInsideRange(item.startsAt, start, end));
  const sales = salesResult.rows.filter((item) => isDateInsideRange(item.createdAt, start, end));
  const customerNames = new Set(
    [...appointments.map((item) => item.customer), ...sales.map((item) => item.customer)].filter(
      (item) => item && item !== "Mostrador",
    ),
  );

  const trend: ReportTrendItem[] = Array.from({ length: preset.days }, (_, index) => {
    const day = subDays(new Date(end), preset.days - 1 - index);
    day.setHours(0, 0, 0, 0);

    const revenue = sales.reduce((sum, sale) => {
      const saleDate = new Date(sale.createdAt);
      const sameDay =
        saleDate.getFullYear() === day.getFullYear() &&
        saleDate.getMonth() === day.getMonth() &&
        saleDate.getDate() === day.getDate();

      return sameDay ? sum + sale.total : sum;
    }, 0);

    return {
      date: day.toISOString(),
      label: formatWeekdayShort(day),
      revenue,
    };
  });

  return {
    mode: "supabase",
    rangeKey: preset.key,
    rangeDays: preset.days,
    rangeLabel: preset.label,
    rangeStart: start.toISOString(),
    rangeEnd: end.toISOString(),
    metrics: {
      revenue: sales.reduce((sum, sale) => sum + sale.total, 0),
      appointmentsCount: appointments.length,
      activeCustomers: customerNames.size,
      conversionRate: appointments.length > 0 ? Math.min(100, Math.round((sales.length / appointments.length) * 100)) : 0,
    },
    appointments: appointments.slice(0, 6),
    sales: sales.slice(0, 8),
    trend,
    error: appointmentsResult.error ?? salesResult.error,
  };
}

export async function getReportSnapshot(
  businessId: string | null | undefined,
  rangeKey: ReportRangeKey = "30d",
): Promise<ReportSnapshot> {
  const preset = getReportRangePreset(rangeKey);

  if (!isSupabaseConfigured() || !businessId) {
    return getDemoReportSnapshot(rangeKey);
  }

  const client = getSupabaseBrowserClient();

  if (!client) {
    return getDemoReportSnapshot(rangeKey);
  }

  const { data, error } = await client.rpc("get_workspace_report_snapshot", {
    target_business_id: businessId,
    range_days: preset.days,
  });

  if (isMissingRpcError(error)) {
    return getReportSnapshotViaTables(businessId, rangeKey);
  }

  if (error) {
    const { start, end } = getRangeDates(preset.days);

    return {
      mode: "supabase",
      rangeKey: preset.key,
      rangeDays: preset.days,
      rangeLabel: preset.label,
      rangeStart: start.toISOString(),
      rangeEnd: end.toISOString(),
      metrics: {
        revenue: 0,
        appointmentsCount: 0,
        activeCustomers: 0,
        conversionRate: 0,
      },
      appointments: [],
      sales: [],
      trend: [],
      error: error.message,
    };
  }

  const payload = (data ?? null) as ReportRpcPayload;
  const { start, end } = getRangeDates(preset.days);

  return {
    mode: "supabase",
    rangeKey: preset.key,
    rangeDays: preset.days,
    rangeLabel: preset.label,
    rangeStart: payload?.rangeStart ?? start.toISOString(),
    rangeEnd: payload?.rangeEnd ?? end.toISOString(),
    metrics: {
      revenue: Number(payload?.metrics?.revenue ?? 0),
      appointmentsCount: Number(payload?.metrics?.appointmentsCount ?? 0),
      activeCustomers: Number(payload?.metrics?.activeCustomers ?? 0),
      conversionRate: Number(payload?.metrics?.conversionRate ?? 0),
    },
    appointments: payload?.appointments ?? [],
    sales: payload?.sales ?? [],
    trend: (payload?.trend ?? []).map((item) => ({
      date: item.date,
      label: formatWeekdayShort(item.date),
      revenue: Number(item.revenue ?? 0),
    })),
    error: null,
  };
}
