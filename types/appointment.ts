import type { SelectOption } from "@/types/options";

export type AppointmentServiceOption = SelectOption & {
  durationMinutes: number;
  price: number;
};

export type AppointmentListItem = {
  id: string;
  customer: string;
  service: string;
  serviceCount: number;
  employee: string;
  time: string;
  startsAt: string;
  endsAt: string;
  status: string;
  source: "demo" | "supabase";
};

export type CreateAppointmentInput = {
  customerId: string;
  serviceIds: string[];
  startsAt: string;
  assignedMembershipId?: string;
  notes?: string;
  status?: string;
};

export type AppointmentFormOptions = {
  customers: SelectOption[];
  services: AppointmentServiceOption[];
  employees: SelectOption[];
};
