"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { createAppointment, listAppointmentOptions, listAppointments } from "@/services/api/appointment-service";
import type { AppointmentFormOptions, AppointmentListItem, CreateAppointmentInput } from "@/types/appointment";

const emptyOptions: AppointmentFormOptions = {
  customers: [],
  services: [],
  employees: [],
};

export function useAppointments() {
  const { workspace, supabaseEnabled, status } = useAuth();
  const [rows, setRows] = useState<AppointmentListItem[]>([]);
  const [options, setOptions] = useState<AppointmentFormOptions>(emptyOptions);
  const [mode, setMode] = useState<"demo" | "supabase">(supabaseEnabled ? "supabase" : "demo");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    const [appointments, nextOptions] = await Promise.all([
      listAppointments(workspace?.businessId),
      listAppointmentOptions(workspace?.businessId),
    ]);
    setRows(appointments.rows);
    setOptions(nextOptions);
    setMode(appointments.mode);
    setError(appointments.error);
    setLoading(false);
  }

  useEffect(() => {
    if (supabaseEnabled && status === "loading") {
      return;
    }

    let isActive = true;

    void Promise.all([
      listAppointments(workspace?.businessId),
      listAppointmentOptions(workspace?.businessId),
    ]).then(([appointments, nextOptions]) => {
      if (!isActive) {
        return;
      }

      setRows(appointments.rows);
      setOptions(nextOptions);
      setMode(appointments.mode);
      setError(appointments.error);
      setLoading(false);
    });

    return () => {
      isActive = false;
    };
  }, [status, supabaseEnabled, workspace?.businessId]);

  async function addAppointment(input: CreateAppointmentInput) {
    const result = await createAppointment(workspace?.businessId, input);

    if (result.error) {
      return { error: result.error };
    }

    await reload();
    return { error: null };
  }

  return { rows, options, mode, loading, error, addAppointment, reload };
}
