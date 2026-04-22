import type { SelectOption } from "@/types/options";

export type SaleListItem = {
  id: string;
  ticket: string;
  customer: string;
  total: number;
  status: string;
  createdAt: string;
  source: "demo" | "supabase";
};

export type CreateSaleInput = {
  customerId?: string;
  total: number;
  status?: string;
  paymentMethod?: string;
};

export type SaleFormOptions = {
  customers: SelectOption[];
};
