import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getSupabaseBrowserClientMock,
  isSupabaseConfiguredMock,
  listAppointmentsMock,
  listSalesMock,
} = vi.hoisted(() => ({
  getSupabaseBrowserClientMock: vi.fn(),
  isSupabaseConfiguredMock: vi.fn(),
  listAppointmentsMock: vi.fn(),
  listSalesMock: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: getSupabaseBrowserClientMock,
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseConfigured: isSupabaseConfiguredMock,
}));

vi.mock("@/services/api/appointment-service", () => ({
  listAppointments: listAppointmentsMock,
}));

vi.mock("@/services/api/sale-service", () => ({
  listSales: listSalesMock,
}));

import { getReportSnapshot } from "@/services/api/report-service";

describe("report service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the report snapshot RPC when available", async () => {
    isSupabaseConfiguredMock.mockReturnValue(true);
    const rpcMock = vi.fn().mockResolvedValue({
      data: {
        rangeStart: "2026-03-25",
        rangeEnd: "2026-04-23",
        previousRangeStart: "2026-02-24",
        previousRangeEnd: "2026-03-24",
        metrics: {
          revenue: 5300,
          appointmentsCount: 22,
          activeCustomers: 17,
          conversionRate: 45,
        },
        previousMetrics: {
          revenue: 4100,
          appointmentsCount: 18,
          activeCustomers: 14,
          conversionRate: 39,
        },
        appointments: [],
        sales: [],
        trend: [
          { date: "2026-04-22", revenue: 800 },
          { date: "2026-04-23", revenue: 1200 },
        ],
      },
      error: null,
    });

    getSupabaseBrowserClientMock.mockReturnValue({
      rpc: rpcMock,
    });

    const snapshot = await getReportSnapshot("biz_1", "30d");

    expect(rpcMock).toHaveBeenCalledWith("get_workspace_report_snapshot", {
      target_business_id: "biz_1",
      range_days: 30,
    });
    expect(snapshot.metrics.revenue).toBe(5300);
    expect(snapshot.metrics.appointmentsCount).toBe(22);
    expect(snapshot.rangeKey).toBe("30d");
    expect(snapshot.comparison.previousMetrics.revenue).toBe(4100);
    expect(snapshot.comparison.metricChanges.revenue.delta).toBe(1200);
    expect(snapshot.trend).toHaveLength(2);
  });

  it("passes explicit start and end dates when the range is custom", async () => {
    isSupabaseConfiguredMock.mockReturnValue(true);
    const rpcMock = vi.fn().mockResolvedValue({
      data: {
        rangeStart: "2026-04-01",
        rangeEnd: "2026-04-15",
        previousRangeStart: "2026-03-17",
        previousRangeEnd: "2026-03-31",
        metrics: {
          revenue: 2800,
          appointmentsCount: 11,
          activeCustomers: 9,
          conversionRate: 36,
        },
        previousMetrics: {
          revenue: 1900,
          appointmentsCount: 8,
          activeCustomers: 7,
          conversionRate: 25,
        },
        appointments: [],
        sales: [],
        trend: [],
      },
      error: null,
    });

    getSupabaseBrowserClientMock.mockReturnValue({
      rpc: rpcMock,
    });

    const snapshot = await getReportSnapshot("biz_1", {
      rangeKey: "custom",
      customStart: "2026-04-01",
      customEnd: "2026-04-15",
    });

    expect(rpcMock).toHaveBeenCalledWith("get_workspace_report_snapshot", {
      target_business_id: "biz_1",
      range_days: 15,
      start_date: "2026-04-01",
      end_date: "2026-04-15",
    });
    expect(snapshot.rangeKey).toBe("custom");
    expect(snapshot.rangeDays).toBe(15);
    expect(snapshot.rangeLabel).toContain("Personalizado");
  });

  it("falls back to service aggregation when the report RPC is missing", async () => {
    isSupabaseConfiguredMock.mockReturnValue(true);
    getSupabaseBrowserClientMock.mockReturnValue({
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: "PGRST202",
          message: "Could not find the function public.get_workspace_report_snapshot",
        },
      }),
    });

    listAppointmentsMock.mockResolvedValue({
      mode: "supabase",
      rows: [
        {
          id: "appt_1",
          customer: "Ana",
          service: "Corte",
          employee: "Luis",
          time: "08:00",
          startsAt: new Date().toISOString(),
          status: "Confirmed",
          source: "supabase",
        },
      ],
      error: null,
    });
    listSalesMock.mockResolvedValue({
      mode: "supabase",
      rows: [
        {
          id: "sale_1",
          ticket: "TK-001",
          customer: "Ana",
          total: 350,
          status: "Paid",
          createdAt: new Date().toISOString(),
          source: "supabase",
        },
      ],
      error: null,
    });

    const snapshot = await getReportSnapshot("biz_1", "7d");

    expect(snapshot.mode).toBe("supabase");
    expect(snapshot.metrics.revenue).toBe(350);
    expect(snapshot.metrics.appointmentsCount).toBe(1);
    expect(snapshot.metrics.activeCustomers).toBe(1);
    expect(snapshot.metrics.conversionRate).toBe(100);
    expect(snapshot.rangeKey).toBe("7d");
    expect(snapshot.comparison.previousMetrics.revenue).toBe(0);
    expect(snapshot.comparison.metricChanges.revenue.delta).toBe(350);
  });
});
