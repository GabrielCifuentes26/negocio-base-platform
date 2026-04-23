import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getSupabaseBrowserClientMock,
  isSupabaseConfiguredMock,
  listCustomersMock,
} = vi.hoisted(() => ({
  getSupabaseBrowserClientMock: vi.fn(),
  isSupabaseConfiguredMock: vi.fn(),
  listCustomersMock: vi.fn(),
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

import { createSale, listSaleOptions, listSales } from "@/services/api/sale-service";

describe("sale service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the sales options RPC when available", async () => {
    isSupabaseConfiguredMock.mockReturnValue(true);
    const rpcMock = vi.fn().mockResolvedValue({
      data: {
        customers: [{ value: "cust_1", label: "Ana", description: "+502 5555 1111" }],
      },
      error: null,
    });

    getSupabaseBrowserClientMock.mockReturnValue({
      rpc: rpcMock,
    });

    const result = await listSaleOptions("biz_1");

    expect(rpcMock).toHaveBeenCalledWith("get_sale_form_options", {
      target_business_id: "biz_1",
    });
    expect(result).toEqual({
      customers: [{ value: "cust_1", label: "Ana", description: "+502 5555 1111" }],
    });
  });

  it("falls back to table-based customer options when the RPC is not available", async () => {
    isSupabaseConfiguredMock.mockReturnValue(true);
    getSupabaseBrowserClientMock.mockReturnValue({
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: {
          code: "PGRST202",
          message: "Could not find the function public.get_sale_form_options",
        },
      }),
    });

    listCustomersMock.mockResolvedValue({
      rows: [{ id: "cust_1", name: "Ana", phone: "+502 5555 1111" }],
    });

    const result = await listSaleOptions("biz_1");

    expect(result).toEqual({
      customers: [{ value: "cust_1", label: "Ana", description: "+502 5555 1111" }],
    });
  });

  it("lists sales through the workspace RPC", async () => {
    isSupabaseConfiguredMock.mockReturnValue(true);
    const rpcMock = vi.fn().mockResolvedValue({
      data: [
        {
          id: "sale_1",
          ticket_number: "TK-001",
          customer_name: "Ana",
          total: 150,
          status: "paid",
          created_at: "2026-04-23T14:30:00.000Z",
        },
      ],
      error: null,
    });

    getSupabaseBrowserClientMock.mockReturnValue({
      rpc: rpcMock,
    });

    const result = await listSales("biz_1");

    expect(rpcMock).toHaveBeenCalledWith("list_workspace_sales", {
      target_business_id: "biz_1",
    });
    expect(result.rows[0]).toEqual(
      expect.objectContaining({
        id: "sale_1",
        ticket: "TK-001",
        customer: "Ana",
        total: 150,
        status: "Paid",
        source: "supabase",
      }),
    );
  });

  it("creates sales through the workspace RPC", async () => {
    isSupabaseConfiguredMock.mockReturnValue(true);
    const rpcMock = vi.fn().mockResolvedValue({
      data: [{ sale_id: "sale_1", ticket_number: "TK-001" }],
      error: null,
    });

    getSupabaseBrowserClientMock.mockReturnValue({
      rpc: rpcMock,
    });

    const result = await createSale("biz_1", "mem_1", {
      customerId: "cust_1",
      total: 175,
      status: "paid",
      paymentMethod: "card",
    });

    expect(rpcMock).toHaveBeenCalledWith("create_workspace_sale", {
      target_business_id: "biz_1",
      sold_by_membership_id_value: "mem_1",
      target_customer_id: "cust_1",
      total_value: 175,
      status_value: "paid",
      payment_method_value: "card",
    });
    expect(result).toEqual({ error: null });
  });
});
