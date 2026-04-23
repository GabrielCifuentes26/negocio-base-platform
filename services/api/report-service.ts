import { addDays, addMinutes, differenceInCalendarDays, subDays } from "date-fns";

import { formatTime, formatWeekdayShort } from "@/lib/format";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isMissingRpcError } from "@/lib/supabase/rpc";
import { getReportRangePreset } from "@/config/reporting";
import { demoMetrics, demoAppointments, demoSales, revenueTrend } from "@/services/api/demo-data";
import { listAppointments } from "@/services/api/appointment-service";
import { listSales } from "@/services/api/sale-service";
import type {
  ReportMetrics,
  ReportMetricChange,
  ReportRangeKey,
  ReportRangeSelection,
  ReportSnapshot,
  ReportTrendItem,
} from "@/types/report";

type ReportRpcPayload = {
  rangeStart?: string;
  rangeEnd?: string;
  metrics?: {
    revenue?: number;
    appointmentsCount?: number;
    activeCustomers?: number;
    conversionRate?: number;
  } | null;
  previousRangeStart?: string;
  previousRangeEnd?: string;
  previousMetrics?: {
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

type ReportRangeWindow = {
  rangeKey: ReportRangeKey;
  rangeDays: number;
  rangeLabel: string;
  rangeStart: Date;
  rangeEnd: Date;
  startDateValue: string | null;
  endDateValue: string | null;
};

function isDateInsideRange(value: string, rangeStart: Date, rangeEnd: Date) {
  const date = new Date(value);
  return date >= rangeStart && date <= rangeEnd;
}

function toDateInputValue(value: Date) {
  return value.toISOString().slice(0, 10);
}

function createDateFromInput(value: string | null | undefined, endOfDay = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}${endOfDay ? "T23:59:59.999Z" : "T00:00:00.000Z"}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getRangeDates(days: number) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = subDays(new Date(end), days - 1);
  start.setHours(0, 0, 0, 0);

  return { start, end };
}

function normalizeReportRangeSelection(
  selection: ReportRangeSelection | ReportRangeKey = "30d",
): ReportRangeSelection {
  return typeof selection === "string" ? { rangeKey: selection } : selection;
}

function buildReportRangeWindow(
  selection: ReportRangeSelection | ReportRangeKey = "30d",
): ReportRangeWindow {
  const normalized = normalizeReportRangeSelection(selection);

  if (normalized.rangeKey === "custom") {
    const customStart = createDateFromInput(normalized.customStart);
    const customEndStart = createDateFromInput(normalized.customEnd);
    const customEnd = createDateFromInput(normalized.customEnd, true);

    if (customStart && customEndStart && customEnd && customStart.getTime() <= customEnd.getTime()) {
      const rawRangeDays = differenceInCalendarDays(customEndStart, customStart) + 1;
      const rangeDays = Math.min(365, Math.max(1, rawRangeDays));
      const cappedEnd = new Date(addDays(customStart, rangeDays - 1));
      cappedEnd.setUTCHours(23, 59, 59, 999);
      const effectiveEnd = cappedEnd.getTime() < customEnd.getTime() ? cappedEnd : customEnd;

      return {
        rangeKey: "custom",
        rangeDays,
        rangeLabel: `Personalizado (${rangeDays} dias)`,
        rangeStart: customStart,
        rangeEnd: effectiveEnd,
        startDateValue: toDateInputValue(customStart),
        endDateValue: toDateInputValue(effectiveEnd),
      };
    }
  }

  const preset = getReportRangePreset(normalized.rangeKey);
  const { start, end } = getRangeDates(preset.days);

  return {
    rangeKey: preset.key,
    rangeDays: preset.days,
    rangeLabel: preset.label,
    rangeStart: start,
    rangeEnd: end,
    startDateValue: null,
    endDateValue: null,
  };
}

function getPreviousRangeDates(rangeStart: Date, days: number) {
  const previousEnd = subDays(new Date(rangeStart), 1);
  previousEnd.setHours(23, 59, 59, 999);

  const previousStart = subDays(new Date(previousEnd), days - 1);
  previousStart.setHours(0, 0, 0, 0);

  return { previousStart, previousEnd };
}

function buildMetricChange(current: number, previous: number): ReportMetricChange {
  const delta = current - previous;
  const deltaPercent = previous === 0 ? (current === 0 ? 0 : null) : Number(((delta / previous) * 100).toFixed(1));

  return {
    current,
    previous,
    delta,
    deltaPercent,
    direction: delta > 0 ? "up" : delta < 0 ? "down" : "neutral",
  };
}

function buildComparison(
  metrics: ReportMetrics,
  previousMetrics: ReportMetrics,
  previousRangeStart: string,
  previousRangeEnd: string,
): ReportSnapshot["comparison"] {
  return {
    previousRangeStart,
    previousRangeEnd,
    previousMetrics,
    metricChanges: {
      revenue: buildMetricChange(metrics.revenue, previousMetrics.revenue),
      appointmentsCount: buildMetricChange(metrics.appointmentsCount, previousMetrics.appointmentsCount),
      activeCustomers: buildMetricChange(metrics.activeCustomers, previousMetrics.activeCustomers),
      conversionRate: buildMetricChange(metrics.conversionRate, previousMetrics.conversionRate),
    },
  };
}

function countActiveCustomers(appointments: ReportSnapshot["appointments"], sales: ReportSnapshot["sales"]) {
  return new Set(
    [...appointments.map((item) => item.customer), ...sales.map((item) => item.customer)].filter(
      (item) => item && item !== "Mostrador",
    ),
  ).size;
}

function getDemoReportSnapshot(rangeSelection: ReportRangeSelection | ReportRangeKey): ReportSnapshot {
  const range = buildReportRangeWindow(rangeSelection);
  const { previousStart, previousEnd } = getPreviousRangeDates(range.rangeStart, range.rangeDays);
  const previousMetrics: ReportMetrics = {
    revenue: Math.round(demoMetrics.revenue * 0.82),
    appointmentsCount: Math.max(0, demoAppointments.length - 3),
    activeCustomers: Math.max(0, demoMetrics.activeCustomers - 12),
    conversionRate: Math.max(0, demoMetrics.conversionRate - 6),
  };
  const metrics: ReportMetrics = {
    revenue: demoMetrics.revenue,
    appointmentsCount: demoAppointments.length,
    activeCustomers: demoMetrics.activeCustomers,
    conversionRate: demoMetrics.conversionRate,
  };

  return {
    mode: "demo",
    rangeKey: range.rangeKey,
    rangeDays: range.rangeDays,
    rangeLabel: range.rangeLabel,
    rangeStart: range.rangeStart.toISOString(),
    rangeEnd: range.rangeEnd.toISOString(),
    metrics,
    comparison: buildComparison(metrics, previousMetrics, previousStart.toISOString(), previousEnd.toISOString()),
    appointments: demoAppointments.slice(0, 4).map((item) => ({
      id: item.id,
      customer: item.customer,
      service: item.service,
      serviceCount: 1,
      employee: item.employee,
      time: `${formatTime(range.rangeStart)} - ${formatTime(addMinutes(range.rangeStart, 45))}`,
      startsAt: range.rangeStart.toISOString(),
      endsAt: addMinutes(range.rangeStart, 45).toISOString(),
      status: item.status,
      source: "demo",
    })),
    sales: demoSales.slice(0, 5).map((item) => ({
      id: item.id,
      ticket: item.ticket,
      customer: item.customer,
      total: item.total,
      status: item.status,
      createdAt: range.rangeEnd.toISOString(),
      source: "demo",
    })),
    trend: revenueTrend.map((item, index) => ({
      date: subDays(new Date(range.rangeEnd), revenueTrend.length - 1 - index).toISOString(),
      label: item.name,
      revenue: item.revenue,
    })),
    error: null,
  };
}

async function getReportSnapshotViaTables(
  businessId: string,
  rangeSelection: ReportRangeSelection | ReportRangeKey,
): Promise<ReportSnapshot> {
  const range = buildReportRangeWindow(rangeSelection);
  const { previousStart, previousEnd } = getPreviousRangeDates(range.rangeStart, range.rangeDays);

  const [appointmentsResult, salesResult] = await Promise.all([listAppointments(businessId), listSales(businessId)]);

  if (appointmentsResult.mode === "demo" || salesResult.mode === "demo") {
    return getDemoReportSnapshot(rangeSelection);
  }

  const appointments = appointmentsResult.rows.filter((item) =>
    isDateInsideRange(item.startsAt, range.rangeStart, range.rangeEnd),
  );
  const sales = salesResult.rows.filter((item) => isDateInsideRange(item.createdAt, range.rangeStart, range.rangeEnd));
  const previousAppointments = appointmentsResult.rows.filter((item) =>
    isDateInsideRange(item.startsAt, previousStart, previousEnd),
  );
  const previousSales = salesResult.rows.filter((item) => isDateInsideRange(item.createdAt, previousStart, previousEnd));

  const trend: ReportTrendItem[] = Array.from({ length: range.rangeDays }, (_, index) => {
    const day = subDays(new Date(range.rangeEnd), range.rangeDays - 1 - index);
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

  const metrics: ReportMetrics = {
    revenue: sales.reduce((sum, sale) => sum + sale.total, 0),
    appointmentsCount: appointments.length,
    activeCustomers: countActiveCustomers(appointments, sales),
    conversionRate: appointments.length > 0 ? Math.min(100, Math.round((sales.length / appointments.length) * 100)) : 0,
  };

  const previousMetrics: ReportMetrics = {
    revenue: previousSales.reduce((sum, sale) => sum + sale.total, 0),
    appointmentsCount: previousAppointments.length,
    activeCustomers: countActiveCustomers(previousAppointments, previousSales),
    conversionRate:
      previousAppointments.length > 0
        ? Math.min(100, Math.round((previousSales.length / previousAppointments.length) * 100))
        : 0,
  };

  return {
    mode: "supabase",
    rangeKey: range.rangeKey,
    rangeDays: range.rangeDays,
    rangeLabel: range.rangeLabel,
    rangeStart: range.rangeStart.toISOString(),
    rangeEnd: range.rangeEnd.toISOString(),
    metrics,
    comparison: buildComparison(metrics, previousMetrics, previousStart.toISOString(), previousEnd.toISOString()),
    appointments: appointments.slice(0, 6),
    sales: sales.slice(0, 8),
    trend,
    error: appointmentsResult.error ?? salesResult.error,
  };
}

export async function getReportSnapshot(
  businessId: string | null | undefined,
  rangeSelection: ReportRangeSelection | ReportRangeKey = "30d",
): Promise<ReportSnapshot> {
  const range = buildReportRangeWindow(rangeSelection);

  if (!isSupabaseConfigured() || !businessId) {
    return getDemoReportSnapshot(rangeSelection);
  }

  const client = getSupabaseBrowserClient();

  if (!client) {
    return getDemoReportSnapshot(rangeSelection);
  }

  const rpcArgs: {
    target_business_id: string;
    range_days: number;
    start_date?: string | null;
    end_date?: string | null;
  } = {
    target_business_id: businessId,
    range_days: range.rangeDays,
  };

  if (range.startDateValue && range.endDateValue) {
    rpcArgs.start_date = range.startDateValue;
    rpcArgs.end_date = range.endDateValue;
  }

  const { data, error } = await client.rpc("get_workspace_report_snapshot", rpcArgs);

  if (isMissingRpcError(error)) {
    return getReportSnapshotViaTables(businessId, rangeSelection);
  }

  if (error) {
    const { previousStart, previousEnd } = getPreviousRangeDates(range.rangeStart, range.rangeDays);
    const emptyMetrics: ReportMetrics = {
      revenue: 0,
      appointmentsCount: 0,
      activeCustomers: 0,
      conversionRate: 0,
    };

    return {
      mode: "supabase",
      rangeKey: range.rangeKey,
      rangeDays: range.rangeDays,
      rangeLabel: range.rangeLabel,
      rangeStart: range.rangeStart.toISOString(),
      rangeEnd: range.rangeEnd.toISOString(),
      metrics: emptyMetrics,
      comparison: buildComparison(emptyMetrics, emptyMetrics, previousStart.toISOString(), previousEnd.toISOString()),
      appointments: [],
      sales: [],
      trend: [],
      error: error.message,
    };
  }

  const payload = (data ?? null) as ReportRpcPayload;
  const { previousStart, previousEnd } = getPreviousRangeDates(range.rangeStart, range.rangeDays);
  const metrics: ReportMetrics = {
    revenue: Number(payload?.metrics?.revenue ?? 0),
    appointmentsCount: Number(payload?.metrics?.appointmentsCount ?? 0),
    activeCustomers: Number(payload?.metrics?.activeCustomers ?? 0),
    conversionRate: Number(payload?.metrics?.conversionRate ?? 0),
  };
  const previousMetrics: ReportMetrics = {
    revenue: Number(payload?.previousMetrics?.revenue ?? 0),
    appointmentsCount: Number(payload?.previousMetrics?.appointmentsCount ?? 0),
    activeCustomers: Number(payload?.previousMetrics?.activeCustomers ?? 0),
    conversionRate: Number(payload?.previousMetrics?.conversionRate ?? 0),
  };

  return {
    mode: "supabase",
    rangeKey: range.rangeKey,
    rangeDays: range.rangeDays,
    rangeLabel: range.rangeLabel,
    rangeStart: payload?.rangeStart ?? range.rangeStart.toISOString(),
    rangeEnd: payload?.rangeEnd ?? range.rangeEnd.toISOString(),
    metrics,
    comparison: buildComparison(
      metrics,
      previousMetrics,
      payload?.previousRangeStart ?? previousStart.toISOString(),
      payload?.previousRangeEnd ?? previousEnd.toISOString(),
    ),
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
