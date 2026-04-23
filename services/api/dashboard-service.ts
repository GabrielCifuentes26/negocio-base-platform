import { demoMetrics, revenueTrend } from "@/services/api/demo-data";
import { formatWeekdayShort } from "@/lib/format";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isMissingRpcError } from "@/lib/supabase/rpc";
import { listAppointments, isAppointmentToday } from "@/services/api/appointment-service";
import { listCustomers } from "@/services/api/customer-service";
import { listSales } from "@/services/api/sale-service";
import type { DashboardSnapshot, DashboardTrendItem } from "@/types/dashboard";

type DashboardRpcPayload = {
  metrics?: {
    revenue?: number;
    appointmentsToday?: number;
    activeCustomers?: number;
    conversionRate?: number;
  } | null;
  appointments?: DashboardSnapshot["appointments"];
  sales?: DashboardSnapshot["sales"];
  trend?: Array<{
    date: string;
    revenue: number;
  }>;
} | null;

async function getDashboardSnapshotViaTables(businessId?: string | null): Promise<DashboardSnapshot> {
  const [appointments, sales, customers] = await Promise.all([
    listAppointments(businessId),
    listSales(businessId),
    listCustomers(businessId),
  ]);

  if (appointments.mode === "demo" || sales.mode === "demo" || customers.mode === "demo") {
    return {
      mode: "demo",
      metrics: demoMetrics,
      appointments: appointments.rows.slice(0, 3),
      sales: sales.rows.slice(0, 5),
      trend: revenueTrend,
      error: appointments.error ?? sales.error ?? customers.error,
    };
  }

  const revenue = sales.rows.reduce((sum, sale) => sum + sale.total, 0);
  const appointmentsToday = appointments.rows.filter((appointment) => isAppointmentToday(appointment.startsAt)).length;
  const activeCustomers = customers.rows.length;
  const conversionRate =
    appointments.rows.length > 0 ? Math.min(100, Math.round((sales.rows.length / appointments.rows.length) * 100)) : 0;

  const trend: DashboardTrendItem[] = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (5 - index));
    const revenueForDay = sales.rows.reduce((sum, sale) => {
      const saleDate = new Date(sale.createdAt);
      const sameDay =
        saleDate.getFullYear() === date.getFullYear() &&
        saleDate.getMonth() === date.getMonth() &&
        saleDate.getDate() === date.getDate();

      return sameDay ? sum + sale.total : sum;
    }, 0);

    return {
      name: formatWeekdayShort(date),
      revenue: revenueForDay,
    };
  });

  return {
    mode: "supabase",
    metrics: {
      revenue,
      appointmentsToday,
      activeCustomers,
      conversionRate,
    },
    appointments: appointments.rows.slice(0, 4),
    sales: sales.rows.slice(0, 5),
    trend,
    error: appointments.error ?? sales.error ?? customers.error,
  };
}

export async function getDashboardSnapshot(businessId?: string | null): Promise<DashboardSnapshot> {
  if (!isSupabaseConfigured() || !businessId) {
    return getDashboardSnapshotViaTables(businessId);
  }

  const client = getSupabaseBrowserClient();

  if (!client) {
    return getDashboardSnapshotViaTables(businessId);
  }

  const { data, error } = await client.rpc("get_workspace_dashboard_snapshot", {
    target_business_id: businessId,
  });

  if (isMissingRpcError(error)) {
    return getDashboardSnapshotViaTables(businessId);
  }

  if (error) {
    return {
      mode: "supabase",
      metrics: {
        revenue: 0,
        appointmentsToday: 0,
        activeCustomers: 0,
        conversionRate: 0,
      },
      appointments: [],
      sales: [],
      trend: [],
      error: error.message,
    };
  }

  const payload = (data ?? null) as DashboardRpcPayload;

  return {
    mode: "supabase",
    metrics: {
      revenue: Number(payload?.metrics?.revenue ?? 0),
      appointmentsToday: Number(payload?.metrics?.appointmentsToday ?? 0),
      activeCustomers: Number(payload?.metrics?.activeCustomers ?? 0),
      conversionRate: Number(payload?.metrics?.conversionRate ?? 0),
    },
    appointments: payload?.appointments ?? [],
    sales: payload?.sales ?? [],
    trend: (payload?.trend ?? []).map((item) => ({
      name: formatWeekdayShort(item.date),
      revenue: Number(item.revenue ?? 0),
    })),
    error: null,
  };
}
