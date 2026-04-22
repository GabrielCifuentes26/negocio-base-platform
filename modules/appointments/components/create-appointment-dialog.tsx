"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { EntityDialog } from "@/components/shared/entity-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { AppointmentFormOptions, CreateAppointmentInput } from "@/types/appointment";

const appointmentSchema = z.object({
  customerId: z.string().min(1),
  serviceId: z.string().min(1),
  assignedMembershipId: z.string().optional(),
  startsAt: z.string().min(1),
  notes: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

export function CreateAppointmentDialog({
  options,
  onCreate,
}: {
  options: AppointmentFormOptions;
  onCreate: (input: CreateAppointmentInput) => Promise<{ error: string | null }>;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      customerId: "",
      serviceId: "",
      assignedMembershipId: "",
      startsAt: "",
      notes: "",
    },
  });

  async function onSubmit(values: AppointmentFormValues) {
    const result = await onCreate({
      customerId: values.customerId,
      serviceId: values.serviceId,
      assignedMembershipId: values.assignedMembershipId || undefined,
      startsAt: values.startsAt,
      notes: values.notes || undefined,
      status: "confirmed",
    });

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Reserva guardada correctamente.");
    form.reset();
    setOpen(false);
  }

  return (
    <EntityDialog triggerLabel="Nueva reserva" title="Crear reserva" open={open} onOpenChange={setOpen}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Cliente</span>
            <NativeSelect {...form.register("customerId")}>
              <option value="">Selecciona un cliente</option>
              {options.customers.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium">Servicio</span>
            <NativeSelect {...form.register("serviceId")}>
              <option value="">Selecciona un servicio</option>
              {options.services.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Empleado</span>
            <NativeSelect {...form.register("assignedMembershipId")}>
              <option value="">Sin asignar</option>
              {options.employees.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium">Fecha y hora</span>
            <Input type="datetime-local" {...form.register("startsAt")} />
          </label>
        </div>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Notas</span>
          <Textarea rows={4} {...form.register("notes")} />
        </label>
        <div className="flex justify-end">
          <Button type="submit" className="rounded-full px-5" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Guardando..." : "Guardar reserva"}
          </Button>
        </div>
      </form>
    </EntityDialog>
  );
}
