import type { SelectOption } from "@/types/options";

export type AppointmentListItem = {
  id: string;
  customer: string;
  service: string;
  employee: string;
  time: string;
  startsAt: string;
  status: string;
  source: "demo" | "supabase";
};

export type CreateAppointmentInput = {
  customerId: string;
  serviceId: string;
  startsAt: string;
  assignedMembershipId?: string;
  notes?: string;
  status?: string;
};

export type AppointmentFormOptions = {
  customers: SelectOption[];
  services: SelectOption[];
  employees: SelectOption[];
};
