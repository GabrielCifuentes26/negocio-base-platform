export type ServiceListItem = {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  status: string;
  source: "demo" | "supabase";
};

export type CreateServiceInput = {
  name: string;
  price: number;
  durationMinutes: number;
  description?: string;
};
