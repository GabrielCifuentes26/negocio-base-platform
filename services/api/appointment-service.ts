import { addMinutes, isSameDay } from "date-fns";

import { formatTime, humanizeStatus } from "@/lib/format";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { demoAppointments } from "@/services/api/demo-data";
import { listCustomers } from "@/services/api/customer-service";
import { listServices } from "@/services/api/service-service";
import { listTeamMembers } from "@/services/api/team-service";
import type { AppointmentFormOptions, AppointmentListItem, CreateAppointmentInput } from "@/types/appointment";
import type { Database } from "@/types/database";

type AppointmentRow = Pick<
  Database["public"]["Tables"]["appointments"]["Row"],
  "id" | "customer_id" | "assigned_membership_id" | "starts_at" | "status"
>;

type AppointmentServiceRow = Pick<
  Database["public"]["Tables"]["appointment_services"]["Row"],
  "appointment_id" | "service_id"
>;

type ServiceLookupRow = Pick<
  Database["public"]["Tables"]["services"]["Row"],
  "id" | "duration_minutes" | "price"
>;

function toDemoRows(): AppointmentListItem[] {
  return demoAppointments.map((appointment) => ({
    id: appointment.id,
    customer: appointment.customer,
    service: appointment.service,
    employee: appointment.employee,
    time: appointment.time,
    startsAt: new Date().toISOString(),
    status: appointment.status,
    source: "demo" as const,
  }));
}

export async function listAppointmentOptions(businessId?: string | null): Promise<AppointmentFormOptions> {
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
      description: `${service.durationMinutes} min`,
    })),
    employees: employees.rows,
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

  const [{ data: appointments, error }, appointmentOptions] = await Promise.all([
    client
      .from("appointments")
      .select("id, customer_id, assigned_membership_id, starts_at, status")
      .eq("business_id", businessId)
      .order("starts_at", { ascending: true }),
    listAppointmentOptions(businessId),
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
  const serviceLinkMap = new Map(
    ((appointmentServices ?? []) as AppointmentServiceRow[]).map((item) => [item.appointment_id, item.service_id]),
  );

  return {
    mode: "supabase" as const,
    rows: appointmentRows.map((appointment) => ({
      id: appointment.id,
      customer: customerMap.get(appointment.customer_id) ?? "Cliente",
      service: serviceMap.get(serviceLinkMap.get(appointment.id) ?? "") ?? "Sin servicio",
      employee: employeeMap.get(appointment.assigned_membership_id ?? "") ?? "Sin asignar",
      time: formatTime(appointment.starts_at),
      startsAt: appointment.starts_at,
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

  const { data: serviceData, error: serviceError } = await client
    .from("services")
    .select("id, duration_minutes, price")
    .eq("id", input.serviceId)
    .maybeSingle();

  if (serviceError || !serviceData) {
    return { error: serviceError?.message ?? "No se pudo cargar el servicio seleccionado." };
  }

  const selectedService = serviceData as ServiceLookupRow;
  const startsAt = new Date(input.startsAt);
  const endsAt = addMinutes(startsAt, selectedService.duration_minutes);

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

  const { error } = await client.from("appointment_services").insert({
    appointment_id: appointment.id,
    service_id: input.serviceId,
    unit_price: selectedService.price,
    quantity: 1,
  });

  return { error: error?.message ?? null };
}

export function isAppointmentToday(startsAt: string) {
  return isSameDay(new Date(startsAt), new Date());
}
