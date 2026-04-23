import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getSupabaseBrowserClientMock,
  isSupabaseConfiguredMock,
  listAppointmentsMock,
  listSalesMock,
  listCustomersMock,
} = vi.hoisted(() => ({
  getSupabaseBrowserClientMock: vi.fn(),
  isSupabaseConfiguredMock: vi.fn(),
  listAppointmentsMock: vi.fn(),
  listSalesMock: vi.fn(),
  listCustomersMock: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: getSupabaseBrowserClientMock,
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseConfigured: isSupabaseConfiguredMock,
}));

vi.mock("@/services/api/appointment-service", () => ({
  listAppointments: listAppointmentsMock,
  isAppointmentToday: vi.fn((value: string) => value.startsWith("2026-04-23")),
}));

vi.mock("@/services/api/sale-service", () => ({
  listSales: listSalesMock,
}));

vi.mock("@/services/api/customer-service", () => ({
  listCustomers: listCustomersMock,
}));

import { getDashboardSnapshot } from "@/services/api/dashboard-service";

describe("dashboard service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the dashboard snapshot RPC when available", async () => {
    isSupabaseConfiguredMock.mockReturnValue(true);
    const rpcMock = vi.fn().mockResolvedValue({
      data: {
        metrics: {
          revenue: 2450,
          appointmentsToday: 6,
          activeCustomers: 42,
          conversionRate: 50,
        },
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
        trend: [
          { date: "2026-04-22", revenue: 900 },
          { date: "2026-04-23", revenue: 1550 },
        ],
      },
      error: null,
    });

    getSupabaseBrowserClientMock.mockReturnValue({
      rpc: rpcMock,
    });

    const snapshot = await getDashboardSnapshot("biz_1");

    expect(rpcMock).toHaveBeenCalledWith("get_workspace_dashboard_snapshot", {
      target_business_id: "biz_1",
    });
    expect(snapshot).toEqual(
      expect.objectContaining({
        mode: "supabase",
        metrics: {
          revenue: 2450,
          appointmentsToday: 6,
          activeCustomers: 42,
          conversionRate: 50,
        },
      }),
    );
    expect(snapshot.appointments).toHaveLength(1);
    expect(snapshot.sales).toHaveLength(1);
    expect(snapshot.trend).toHaveLength(2);
  });

  it("falls back to service aggregation when the dashboard RPC is missing", async () => {
    isSupabaseConfiguredMock.mockReturnValue(true);
    getSupabaseBrowserClientMock.mockReturnValue({
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: "PGRST202",
          message: "Could not find the function public.get_workspace_dashboard_snapshot",
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
          startsAt: "2026-04-23T08:00:00.000Z",
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
          createdAt: "2026-04-23T09:00:00.000Z",
          source: "supabase",
        },
      ],
      error: null,
    });
    listCustomersMock.mockResolvedValue({
      mode: "supabase",
      rows: [
        { id: "cust_1", name: "Ana", email: null, phone: null, notes: null, visits: 0, lastVisit: "2026-04-23", source: "supabase" },
      ],
      error: null,
    });

    const snapshot = await getDashboardSnapshot("biz_1");

    expect(snapshot.mode).toBe("supabase");
    expect(snapshot.metrics.revenue).toBe(350);
    expect(snapshot.metrics.appointmentsToday).toBe(1);
    expect(snapshot.metrics.activeCustomers).toBe(1);
    expect(snapshot.metrics.conversionRate).toBe(100);
  });
});
