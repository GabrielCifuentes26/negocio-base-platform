import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getSupabaseBrowserClientMock,
  isSupabaseConfiguredMock,
  listCustomersMock,
  listServicesMock,
  listTeamMembersMock,
} = vi.hoisted(() => ({
  getSupabaseBrowserClientMock: vi.fn(),
  isSupabaseConfiguredMock: vi.fn(),
  listCustomersMock: vi.fn(),
  listServicesMock: vi.fn(),
  listTeamMembersMock: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: getSupabaseBrowserClientMock,
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseConfigured: isSupabaseConfiguredMock,
}));

vi.mock("@/services/api/customer-service", () => ({
  listCustomers: listCustomersMock,
}));

vi.mock("@/services/api/service-service", () => ({
  listServices: listServicesMock,
}));

vi.mock("@/services/api/team-service", () => ({
  listTeamMembers: listTeamMembersMock,
}));

import {
  createAppointment,
  listAppointmentOptions,
  listAppointments,
} from "@/services/api/appointment-service";

describe("appointment service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the appointment options RPC when available", async () => {
    isSupabaseConfiguredMock.mockReturnValue(true);
    const rpcMock = vi.fn().mockResolvedValue({
      data: {
        customers: [{ value: "cust_1", label: "Ana", description: "+502 5555 1111" }],
        services: [
          {
            value: "srv_1",
            label: "Corte",
            description: "45 min · Q 120.00",
            durationMinutes: 45,
            price: 120,
          },
        ],
        employees: [{ value: "mem_1", label: "Luis", description: "Staff" }],
      },
      error: null,
    });

    getSupabaseBrowserClientMock.mockReturnValue({
      rpc: rpcMock,
    });

    const result = await listAppointmentOptions("biz_1");

    expect(rpcMock).toHaveBeenCalledWith("get_appointment_form_options", {
      target_business_id: "biz_1",
    });
    expect(result).toEqual({
      customers: [{ value: "cust_1", label: "Ana", description: "+502 5555 1111" }],
      services: [
        {
          value: "srv_1",
          label: "Corte",
          description: "45 min · Q 120.00",
          durationMinutes: 45,
          price: 120,
        },
      ],
      employees: [{ value: "mem_1", label: "Luis", description: "Staff" }],
    });
  });

  it("falls back to table-based options when the RPC is not available", async () => {
    isSupabaseConfiguredMock.mockReturnValue(true);
    getSupabaseBrowserClientMock.mockReturnValue({
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: "PGRST202",
          message: "Could not find the function public.get_appointment_form_options",
        },
      }),
    });

    listCustomersMock.mockResolvedValue({
      rows: [{ id: "cust_1", name: "Ana", phone: "+502 5555 1111" }],
    });
    listServicesMock.mockResolvedValue({
      rows: [{ id: "srv_1", name: "Corte", durationMinutes: 45, price: 120 }],
    });
    listTeamMembersMock.mockResolvedValue({
      rows: [{ value: "mem_1", label: "Luis", description: "Staff" }],
    });

    const result = await listAppointmentOptions("biz_1");

    expect(result).toEqual({
      customers: [{ value: "cust_1", label: "Ana", description: "+502 5555 1111" }],
      services: [
        {
          value: "srv_1",
          label: "Corte",
          description: expect.stringContaining("45 min"),
          durationMinutes: 45,
          price: 120,
        },
      ],
      employees: [{ value: "mem_1", label: "Luis", description: "Staff" }],
    });
  });

  it("lists appointments through the workspace RPC with aggregated services", async () => {
    isSupabaseConfiguredMock.mockReturnValue(true);
    const rpcMock = vi.fn().mockResolvedValue({
      data: [
        {
          id: "appt_1",
          customer_name: "Ana",
          service_name: "Corte + Barba",
          service_count: 2,
          employee_name: "Luis",
          starts_at: "2026-04-23T14:30:00.000Z",
          ends_at: "2026-04-23T15:30:00.000Z",
          status: "confirmed",
        },
      ],
      error: null,
    });

    getSupabaseBrowserClientMock.mockReturnValue({
      rpc: rpcMock,
    });

    const result = await listAppointments("biz_1");

    expect(rpcMock).toHaveBeenCalledWith("list_workspace_appointments", {
      target_business_id: "biz_1",
    });
    expect(result.error).toBeNull();
    expect(result.rows[0]).toEqual(
      expect.objectContaining({
        id: "appt_1",
        customer: "Ana",
        service: "Corte + Barba",
        serviceCount: 2,
        employee: "Luis",
        status: "Confirmed",
        source: "supabase",
      }),
    );
  });

  it("creates multi-service appointments through the workspace RPC", async () => {
    isSupabaseConfiguredMock.mockReturnValue(true);
    const rpcMock = vi.fn().mockResolvedValue({
      data: [{ appointment_id: "appt_1" }],
      error: null,
    });

    getSupabaseBrowserClientMock.mockReturnValue({
      rpc: rpcMock,
    });

    const result = await createAppointment("biz_1", {
      customerId: "cust_1",
      serviceIds: ["srv_1", "srv_2"],
      assignedMembershipId: "mem_1",
      startsAt: "2026-04-23T14:30:00.000Z",
      notes: "Cliente frecuente",
      status: "confirmed",
    });

    expect(rpcMock).toHaveBeenCalledWith("create_workspace_appointment", {
      target_business_id: "biz_1",
      target_customer_id: "cust_1",
      target_service_ids: ["srv_1", "srv_2"],
      starts_at_value: "2026-04-23T14:30:00.000Z",
      assigned_membership_id_value: "mem_1",
      notes_value: "Cliente frecuente",
      status_value: "confirmed",
    });
    expect(result).toEqual({ error: null });
  });
});
