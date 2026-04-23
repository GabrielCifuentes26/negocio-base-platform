import { describe, expect, it } from "vitest";

import { buildDashboardSnapshotCsv } from "@/services/export/report-export";

describe("report export", () => {
  it("builds a csv export with metrics, trend, appointments and sales", () => {
    const csv = buildDashboardSnapshotCsv(
      {
        mode: "supabase",
        metrics: {
          revenue: 2500,
          appointmentsToday: 8,
          activeCustomers: 43,
          conversionRate: 50,
        },
        trend: [
          { name: "Lun", revenue: 800 },
          { name: "Mar", revenue: 1700 },
        ],
        appointments: [
          {
            id: "appt_1",
            customer: "Ana",
            service: "Corte",
            employee: "Luis",
            time: "08:00",
            startsAt: "2026-04-23T08:00:00.000Z",
            status: "Confirmed",
            source: "supabase",
          },
        ],
        sales: [
          {
            id: "sale_1",
            ticket: "TK-001",
            customer: "Ana",
            total: 350,
            status: "Paid",
            createdAt: "2026-04-23T09:00:00.000Z",
            source: "supabase",
          },
        ],
        error: null,
      },
      "Salon Aurora",
    );

    expect(csv).toContain("section,label,value,detail,extra,date");
    expect(csv).toContain("metric,revenue,2500");
    expect(csv).toContain("trend,Lun,800");
    expect(csv).toContain("appointment,Ana,Confirmed,Corte / Luis,08:00,2026-04-23T08:00:00.000Z");
    expect(csv).toContain("sale,TK-001,350,Ana,Paid,2026-04-23T09:00:00.000Z");
  });
});
