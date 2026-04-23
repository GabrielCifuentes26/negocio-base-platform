import { addMinutes, isSameDay } from "date-fns";

import { formatCurrency, formatTime, humanizeStatus } from "@/lib/format";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isMissingRpcError } from "@/lib/supabase/rpc";
import { demoAppointments } from "@/services/api/demo-data";
import { listCustomers } from "@/services/api/customer-service";
import { listServices } from "@/services/api/service-service";
import { listTeamMembers } from "@/services/api/team-service";
import type {
  AppointmentFormOptions,
  AppointmentListItem,
  AppointmentServiceOption,
  CreateAppointmentInput,
} from "@/types/appointment";
import type { Database } from "@/types/database";

type AppointmentRow = Pick<
  Database["public"]["Tables"]["appointments"]["Row"],
  "id" | "customer_id" | "assigned_membership_id" | "starts_at" | "ends_at" | "status"
>;

type AppointmentServiceRow = Pick<
  Database["public"]["Tables"]["appointment_services"]["Row"],
  "appointment_id" | "service_id"
>;

type ServiceLookupRow = Pick<
  Database["public"]["Tables"]["services"]["Row"],
  "id" | "duration_minutes" | "price" | "name"
>;

type AppointmentRpcRow = {
  id: string;
  customer_name: string;
  service_name: string;
  service_count: number;
  employee_name: string;
  starts_at: string;
  ends_at: string;
  status: string;
};

type RpcCustomerOption = {
  value: string;
  label: string;
  description?: string | null;
};

type RpcServiceOption = RpcCustomerOption & {
  durationMinutes?: number | null;
  price?: number | null;
};

type AppointmentOptionsPayload = {
  customers?: RpcCustomerOption[];
  services?: RpcServiceOption[];
  employees?: RpcCustomerOption[];
} | null;

function toDemoRows(): AppointmentListItem[] {
  return demoAppointments.map((appointment) => {
    const startsAt = new Date();
    const endsAt = addMinutes(new Date(startsAt), 45);

    return {
      id: appointment.id,
      customer: appointment.customer,
      service: appointment.service,
      serviceCount: 1,
      employee: appointment.employee,
      time: `${formatTime(startsAt)} - ${formatTime(endsAt)}`,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      status: appointment.status,
      source: "demo" as const,
    };
  });
}

function normalizeServiceOptions(items?: RpcServiceOption[] | null): AppointmentServiceOption[] {
  return (items ?? []).map((item) => ({
    value: item.value,
    label: item.label,
    description: item.description ?? undefined,
    durationMinutes: Number(item.durationMinutes ?? 0),
    price: Number(item.price ?? 0),
  }));
}

function normalizeOptions(items?: RpcCustomerOption[] | null) {
  return (items ?? []).map((item) => ({
    value: item.value,
    label: item.label,
    description: item.description ?? undefined,
  }));
}

function buildAppointmentServiceSummary(serviceNames: string[]) {
  if (serviceNames.length === 0) {
    return "Sin servicio";
  }

  return serviceNames.join(" + ");
}

function getUniqueServiceIds(serviceIds: string[]) {
  return [...new Set(serviceIds.filter(Boolean))];
}

async function listAppointmentOptionsViaTables(businessId?: string | null): Promise<AppointmentFormOptions> {
  const [customers, services, employees] = await Promise.all([
    listCustomers(businessId),
    listServices(businessId),
    listTeamMembers(businessId),
  ]);

  return {
    customers: customers.rows.map((customer) => ({
      value: customer.id,
      label: customer.name,
      description: customer.phone ?? undefined,
    })),
    services: services.rows.map((service) => ({
      value: service.id,
      label: service.name,
      description: `${service.durationMinutes} min · ${formatCurrency(service.price)}`,
      durationMinutes: service.durationMinutes,
      price: service.price,
    })),
    employees: employees.rows,
  };
}

async function listAppointmentsViaTables(businessId: string) {
  const client = getSupabaseBrowserClient();

  if (!client) {
    return { mode: "demo" as const, rows: toDemoRows(), error: null };
  }

  const [{ data: appointments, error }, appointmentOptions] = await Promise.all([
    client
      .from("appointments")
      .select("id, customer_id, assigned_membership_id, starts_at, ends_at, status")
      .eq("business_id", businessId)
      .order("starts_at", { ascending: true }),
    listAppointmentOptionsViaTables(businessId),
  ]);

  if (error) {
    return { mode: "supabase" as const, rows: [] as AppointmentListItem[], error: error.message };
  }

  const appointmentRows = (appointments ?? []) as AppointmentRow[];
  const appointmentIds = appointmentRows.map((appointment) => appointment.id);
  const { data: appointmentServices } =
    appointmentIds.length > 0
      ? await client
          .from("appointment_services")
          .select("appointment_id, service_id")
          .in("appointment_id", appointmentIds)
      : { data: [] as AppointmentServiceRow[] };

  const customerMap = new Map(appointmentOptions.customers.map((item) => [item.value, item.label]));
  const serviceMap = new Map(appointmentOptions.services.map((item) => [item.value, item.label]));
  const employeeMap = new Map(appointmentOptions.employees.map((item) => [item.value, item.label]));
  const servicesByAppointment = new Map<string, string[]>();

  for (const item of (appointmentServices ?? []) as AppointmentServiceRow[]) {
    const serviceNames = servicesByAppointment.get(item.appointment_id) ?? [];
    const serviceName = serviceMap.get(item.service_id);

    if (serviceName) {
      serviceNames.push(serviceName);
      servicesByAppointment.set(item.appointment_id, serviceNames);
    }
  }

  return {
    mode: "supabase" as const,
    rows: appointmentRows.map((appointment) => {
      const serviceNames = servicesByAppointment.get(appointment.id) ?? [];

      return {
        id: appointment.id,
        customer: customerMap.get(appointment.customer_id) ?? "Cliente",
        service: buildAppointmentServiceSummary(serviceNames),
        serviceCount: serviceNames.length || 1,
        employee: employeeMap.get(appointment.assigned_membership_id ?? "") ?? "Sin asignar",
        time: `${formatTime(appointment.starts_at)} - ${formatTime(appointment.ends_at)}`,
        startsAt: appointment.starts_at,
        endsAt: appointment.ends_at,
        status: humanizeStatus(appointment.status),
        source: "supabase" as const,
      };
    }),
    error: null,
  };
}

async function createAppointmentViaTables(businessId: string, input: CreateAppointmentInput) {
  const client = getSupabaseBrowserClient();

  if (!client) {
    return { error: "No se pudo inicializar el cliente de Supabase." };
  }

  const serviceIds = getUniqueServiceIds(input.serviceIds);

  if (serviceIds.length === 0) {
    return { error: "Debes seleccionar al menos un servicio." };
  }

  const { data: servicesData, error: serviceError } = await client
    .from("services")
    .select("id, name, duration_minutes, price")
    .in("id", serviceIds)
    .eq("business_id", businessId)
    .eq("is_active", true);

  if (serviceError) {
    return { error: serviceError.message };
  }

  const selectedServices = (servicesData ?? []) as ServiceLookupRow[];

  if (selectedServices.length !== serviceIds.length) {
    return { error: "Uno o varios servicios ya no estan disponibles para este negocio." };
  }

  const startsAt = new Date(input.startsAt);
  const totalDuration = selectedServices.reduce((sum, service) => sum + service.duration_minutes, 0);
  const endsAt = addMinutes(startsAt, totalDuration);

  const { data: appointment, error: appointmentError } = await client
    .from("appointments")
    .insert({
      business_id: businessId,
      customer_id: input.customerId,
      assigned_membership_id: input.assignedMembershipId ?? null,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: input.status ?? "pending",
      notes: input.notes ?? null,
    })
    .select("id")
    .single();

  if (appointmentError || !appointment) {
    return { error: appointmentError?.message ?? "No se pudo crear la cita." };
  }

  const { error } = await client.from("appointment_services").insert(
    selectedServices.map((service) => ({
      appointment_id: appointment.id,
      service_id: service.id,
      unit_price: service.price,
      quantity: 1,
    })),
  );

  return { error: error?.message ?? null };
}

export async function listAppointmentOptions(businessId?: string | null): Promise<AppointmentFormOptions> {
  if (!isSupabaseConfigured() || !businessId) {
    return listAppointmentOptionsViaTables(businessId);
  }

  const client = getSupabaseBrowserClient();

  if (!client) {
    return listAppointmentOptionsViaTables(businessId);
  }

  const { data, error } = await client.rpc("get_appointment_form_options", {
    target_business_id: businessId,
  });

  if (isMissingRpcError(error)) {
    return listAppointmentOptionsViaTables(businessId);
  }

  if (error) {
    return {
      customers: [],
      services: [],
      employees: [],
    };
  }

  const payload = (data ?? null) as AppointmentOptionsPayload;

  return {
    customers: normalizeOptions(payload?.customers),
    services: normalizeServiceOptions(payload?.services),
    employees: normalizeOptions(payload?.employees),
  };
}

export async function listAppointments(businessId?: string | null) {
  if (!isSupabaseConfigured()) {
    return { mode: "demo" as const, rows: toDemoRows(), error: null };
  }

  if (!businessId) {
    return { mode: "supabase" as const, rows: [] as AppointmentListItem[], error: null };
  }

  const client = getSupabaseBrowserClient();

  if (!client) {
    return { mode: "demo" as const, rows: toDemoRows(), error: null };
  }

  const { data, error } = await client.rpc("list_workspace_appointments", {
    target_business_id: businessId,
  });

  if (isMissingRpcError(error)) {
    return listAppointmentsViaTables(businessId);
  }

  if (error) {
    return { mode: "supabase" as const, rows: [] as AppointmentListItem[], error: error.message };
  }

  return {
    mode: "supabase" as const,
    rows: ((data ?? []) as AppointmentRpcRow[]).map((appointment) => ({
      id: appointment.id,
      customer: appointment.customer_name ?? "Cliente",
      service: appointment.service_name ?? "Sin servicio",
      serviceCount: Number(appointment.service_count ?? 1),
      employee: appointment.employee_name ?? "Sin asignar",
      time: `${formatTime(appointment.starts_at)} - ${formatTime(appointment.ends_at)}`,
      startsAt: appointment.starts_at,
      endsAt: appointment.ends_at,
      status: humanizeStatus(appointment.status),
      source: "supabase" as const,
    })),
    error: null,
  };
}

export async function createAppointment(
  businessId: string | null | undefined,
  input: CreateAppointmentInput,
) {
  if (!isSupabaseConfigured() || !businessId) {
    return { error: null };
  }

  const client = getSupabaseBrowserClient();

  if (!client) {
    return { error: "No se pudo inicializar el cliente de Supabase." };
  }

  const serviceIds = getUniqueServiceIds(input.serviceIds);

  if (serviceIds.length === 0) {
    return { error: "Debes seleccionar al menos un servicio." };
  }

  const { error } = await client.rpc("create_workspace_appointment", {
    target_business_id: businessId,
    target_customer_id: input.customerId,
    target_service_ids: serviceIds,
    starts_at_value: new Date(input.startsAt).toISOString(),
    assigned_membership_id_value: input.assignedMembershipId ?? null,
    notes_value: input.notes ?? null,
    status_value: input.status ?? "pending",
  });

  if (isMissingRpcError(error)) {
    return createAppointmentViaTables(businessId, input);
  }

  return { error: error?.message ?? null };
}

export function isAppointmentToday(startsAt: string) {
  return isSameDay(new Date(startsAt), new Date());
}
