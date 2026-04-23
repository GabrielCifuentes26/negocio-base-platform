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
        metrics: {
          revenue: 5300,
          appointmentsCount: 22,
          activeCustomers: 17,
          conversionRate: 45,
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
    expect(snapshot.trend).toHaveLength(2);
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
  });
});
