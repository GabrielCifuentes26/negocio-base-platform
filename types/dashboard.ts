import type { AppointmentListItem } from "@/types/appointment";
import type { SaleListItem } from "@/types/sale";

export type DashboardMetrics = {
  revenue: number;
  appointmentsToday: number;
  activeCustomers: number;
  conversionRate: number;
};

export type DashboardTrendItem = {
  name: string;
  revenue: number;
};

export type DashboardSnapshot = {
  mode: "demo" | "supabase";
  metrics: DashboardMetrics;
  appointments: AppointmentListItem[];
  sales: SaleListItem[];
  trend: DashboardTrendItem[];
  error: string | null;
};
