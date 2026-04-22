"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { EntityDialog } from "@/components/shared/entity-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CreateServiceInput } from "@/types/service";

const serviceSchema = z.object({
  name: z.string().min(2),
  price: z.number().min(0),
  durationMinutes: z.number().min(5),
  description: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export function CreateServiceDialog({
  onCreate,
}: {
  onCreate: (input: CreateServiceInput) => Promise<{ error: string | null }>;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      price: 0,
      durationMinutes: 30,
      description: "",
    },
  });

  async function onSubmit(values: ServiceFormValues) {
    const result = await onCreate(values);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Servicio guardado correctamente.");
    form.reset();
    setOpen(false);
  }

  return (
    <EntityDialog triggerLabel="Nuevo servicio" title="Crear servicio" open={open} onOpenChange={setOpen}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Nombre</span>
          <Input {...form.register("name")} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Precio</span>
            <Input type="number" step="0.01" {...form.register("price", { valueAsNumber: true })} />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium">Duracion en minutos</span>
            <Input type="number" {...form.register("durationMinutes", { valueAsNumber: true })} />
          </label>
        </div>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Descripcion</span>
          <Textarea rows={4} {...form.register("description")} />
        </label>
        <div className="flex justify-end">
          <Button type="submit" className="rounded-full px-5" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Guardando..." : "Guardar servicio"}
          </Button>
        </div>
      </form>
    </EntityDialog>
  );
}
