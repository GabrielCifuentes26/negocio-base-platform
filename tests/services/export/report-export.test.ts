import { describe, expect, it } from "vitest";

import { buildDashboardSnapshotCsv, buildReportSnapshotCsv } from "@/services/export/report-export";

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
            serviceCount: 1,
            employee: "Luis",
            time: "08:00",
            startsAt: "2026-04-23T08:00:00.000Z",
            endsAt: "2026-04-23T08:45:00.000Z",
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

  it("builds a report csv export including the selected range", () => {
    const csv = buildReportSnapshotCsv(
      {
        mode: "supabase",
        rangeKey: "30d",
        rangeDays: 30,
        rangeLabel: "30 dias",
        rangeStart: "2026-03-25T00:00:00.000Z",
        rangeEnd: "2026-04-23T23:59:59.999Z",
        metrics: {
          revenue: 6200,
          appointmentsCount: 18,
          activeCustomers: 12,
          conversionRate: 44,
        },
        comparison: {
          previousRangeStart: "2026-02-24T00:00:00.000Z",
          previousRangeEnd: "2026-03-24T23:59:59.999Z",
          previousMetrics: {
            revenue: 4100,
            appointmentsCount: 12,
            activeCustomers: 10,
            conversionRate: 33,
          },
          metricChanges: {
            revenue: { current: 6200, previous: 4100, delta: 2100, deltaPercent: 51.2, direction: "up" },
            appointmentsCount: { current: 18, previous: 12, delta: 6, deltaPercent: 50, direction: "up" },
            activeCustomers: { current: 12, previous: 10, delta: 2, deltaPercent: 20, direction: "up" },
            conversionRate: { current: 44, previous: 33, delta: 11, deltaPercent: 33.3, direction: "up" },
          },
        },
        trend: [{ date: "2026-04-23T00:00:00.000Z", label: "jue", revenue: 1200 }],
        appointments: [],
        sales: [],
        error: null,
      },
      "Salon Aurora",
    );

    expect(csv).toContain("meta,range_start,2026-03-25T00:00:00.000Z,2026-04-23T23:59:59.999Z,30d");
    expect(csv).toContain("meta,previous_range_start,2026-02-24T00:00:00.000Z,2026-03-24T23:59:59.999Z,previous_period");
    expect(csv).toContain("metric,appointments_count,18");
    expect(csv).toContain("metric_previous,revenue,4100,2100,51.2%");
    expect(csv).toContain("trend,jue,1200,2026-04-23T00:00:00.000Z");
  });
});
