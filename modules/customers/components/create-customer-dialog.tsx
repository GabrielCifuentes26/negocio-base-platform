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
import type { CreateCustomerInput } from "@/types/customer";

const customerSchema = z.object({
  fullName: z.string().min(2),
  email: z.email().optional().or(z.literal("")),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export function CreateCustomerDialog({
  onCreate,
}: {
  onCreate: (input: CreateCustomerInput) => Promise<{ error: string | null }>;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      notes: "",
    },
  });

  async function onSubmit(values: CustomerFormValues) {
    const result = await onCreate({
      fullName: values.fullName,
      email: values.email || undefined,
      phone: values.phone || undefined,
      notes: values.notes || undefined,
    });

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Cliente creado correctamente.");
    form.reset();
    setOpen(false);
  }

  return (
    <EntityDialog
      triggerLabel="Nuevo cliente"
      title="Crear cliente"
      open={open}
      onOpenChange={setOpen}
    >
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Nombre completo</span>
          <Input {...form.register("fullName")} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Correo</span>
            <Input {...form.register("email")} />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium">Telefono</span>
            <Input {...form.register("phone")} />
          </label>
        </div>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Notas</span>
          <Textarea rows={4} {...form.register("notes")} />
        </label>
        <div className="flex justify-end">
          <Button type="submit" className="rounded-full px-5" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Guardando..." : "Guardar cliente"}
          </Button>
        </div>
      </form>
    </EntityDialog>
  );
}
