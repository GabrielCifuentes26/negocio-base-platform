import type { AppointmentListItem } from "@/types/appointment";
import type { SaleListItem } from "@/types/sale";

export type ReportRangeKey = "7d" | "30d" | "90d" | "custom";
export type ReportRangeSelection = {
  rangeKey: ReportRangeKey;
  customStart?: string | null;
  customEnd?: string | null;
};

export type ReportMetrics = {
  revenue: number;
  appointmentsCount: number;
  activeCustomers: number;
  conversionRate: number;
};

export type ReportTrendItem = {
  date: string;
  label: string;
  revenue: number;
};

export type ReportMetricChange = {
  current: number;
  previous: number;
  delta: number;
  deltaPercent: number | null;
  direction: "up" | "down" | "neutral";
};

export type ReportComparison = {
  previousRangeStart: string;
  previousRangeEnd: string;
  previousMetrics: ReportMetrics;
  metricChanges: {
    revenue: ReportMetricChange;
    appointmentsCount: ReportMetricChange;
    activeCustomers: ReportMetricChange;
    conversionRate: ReportMetricChange;
  };
};

export type ReportSnapshot = {
  mode: "demo" | "supabase";
  rangeKey: ReportRangeKey;
  rangeDays: number;
  rangeLabel: string;
  rangeStart: string;
  rangeEnd: string;
  metrics: ReportMetrics;
  comparison: ReportComparison;
  appointments: AppointmentListItem[];
  sales: SaleListItem[];
  trend: ReportTrendItem[];
  error: string | null;
};
