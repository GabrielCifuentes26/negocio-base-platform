export type CustomerListItem = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  visits: number;
  lastVisit: string;
  source: "demo" | "supabase";
};

export type CreateCustomerInput = {
  fullName: string;
  email?: string;
  phone?: string;
  notes?: string;
};
