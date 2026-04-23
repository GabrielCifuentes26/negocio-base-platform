import type { AppointmentListItem } from "@/types/appointment";
import type { SaleListItem } from "@/types/sale";

export type ReportRangeKey = "7d" | "30d" | "90d";

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

export type ReportSnapshot = {
  mode: "demo" | "supabase";
  rangeKey: ReportRangeKey;
  rangeDays: number;
  rangeLabel: string;
  rangeStart: string;
  rangeEnd: string;
  metrics: ReportMetrics;
  appointments: AppointmentListItem[];
  sales: SaleListItem[];
  trend: ReportTrendItem[];
  error: string | null;
};
