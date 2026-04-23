"use client";

import { useMemo, useState } from "react";
import { addMinutes } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { EntityDialog } from "@/components/shared/entity-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatTime } from "@/lib/format";
import type { AppointmentFormOptions, CreateAppointmentInput } from "@/types/appointment";

const appointmentSchema = z.object({
  customerId: z.string().min(1),
  serviceIds: z.array(z.string()).min(1, "Selecciona al menos un servicio."),
  assignedMembershipId: z.string().optional(),
  startsAt: z.string().min(1),
  notes: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;
const EMPTY_SERVICE_IDS: string[] = [];

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
      serviceIds: [],
      assignedMembershipId: "",
      startsAt: "",
      notes: "",
    },
  });

  const watchedServiceIds = useWatch({
    control: form.control,
    name: "serviceIds",
  });
  const selectedServiceIds = watchedServiceIds ?? EMPTY_SERVICE_IDS;
  const startsAt = useWatch({
    control: form.control,
    name: "startsAt",
  });
  const selectedServices = useMemo(
    () => options.services.filter((service) => selectedServiceIds.includes(service.value)),
    [options.services, selectedServiceIds],
  );
  const totalDuration = selectedServices.reduce((sum, service) => sum + service.durationMinutes, 0);
  const totalPrice = selectedServices.reduce((sum, service) => sum + service.price, 0);
  const estimatedEnd = startsAt ? addMinutes(new Date(startsAt), totalDuration || 0) : null;

  function toggleService(serviceId: string) {
    const nextValues = selectedServiceIds.includes(serviceId)
      ? selectedServiceIds.filter((currentId) => currentId !== serviceId)
      : [...selectedServiceIds, serviceId];

    form.setValue("serviceIds", nextValues, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  async function onSubmit(values: AppointmentFormValues) {
    const result = await onCreate({
      customerId: values.customerId,
      serviceIds: values.serviceIds,
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
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="font-medium">Servicios</span>
            <Badge variant="outline">{selectedServices.length} seleccionados</Badge>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {options.services.map((service) => {
              const selected = selectedServiceIds.includes(service.value);

              return (
                <button
                  key={service.value}
                  type="button"
                  className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                    selected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border/70 bg-muted/15 hover:border-primary/40"
                  }`}
                  onClick={() => toggleService(service.value)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{service.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {service.durationMinutes} min · {formatCurrency(service.price)}
                      </p>
                    </div>
                    {selected ? <Badge>Activo</Badge> : <Badge variant="outline">Agregar</Badge>}
                  </div>
                </button>
              );
            })}
          </div>
          {form.formState.errors.serviceIds ? (
            <p className="text-sm text-destructive">{form.formState.errors.serviceIds.message}</p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Fecha y hora</span>
            <Input type="datetime-local" {...form.register("startsAt")} />
          </label>
          <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">Resumen rapido</p>
            <p className="mt-2 text-muted-foreground">Duracion total: {totalDuration} min</p>
            <p className="text-muted-foreground">Valor de referencia: {formatCurrency(totalPrice)}</p>
            <p className="text-muted-foreground">
              Finaliza aprox.: {estimatedEnd ? formatTime(estimatedEnd) : "Selecciona hora"}
            </p>
          </div>
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
