import { subDays } from "date-fns";

import { demoMetrics, revenueTrend } from "@/services/api/demo-data";
import { formatWeekdayShort } from "@/lib/format";
import { listAppointments, isAppointmentToday } from "@/services/api/appointment-service";
import { listCustomers } from "@/services/api/customer-service";
import { listSales } from "@/services/api/sale-service";
import type { DashboardSnapshot, DashboardTrendItem } from "@/types/dashboard";

export async function getDashboardSnapshot(businessId?: string | null): Promise<DashboardSnapshot> {
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
    const date = subDays(new Date(), 5 - index);
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
