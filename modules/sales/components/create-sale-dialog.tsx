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
import type { CreateSaleInput, SaleFormOptions } from "@/types/sale";

const saleSchema = z.object({
  customerId: z.string().optional(),
  total: z.number().min(0.01),
  status: z.string().min(1),
  paymentMethod: z.string().min(1),
});

type SaleFormValues = z.infer<typeof saleSchema>;

export function CreateSaleDialog({
  options,
  onCreate,
}: {
  options: SaleFormOptions;
  onCreate: (input: CreateSaleInput) => Promise<{ error: string | null }>;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      customerId: "",
      total: 0,
      status: "paid",
      paymentMethod: "cash",
    },
  });

  async function onSubmit(values: SaleFormValues) {
    const result = await onCreate({
      customerId: values.customerId || undefined,
      total: values.total,
      status: values.status,
      paymentMethod: values.paymentMethod,
    });

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Venta guardada correctamente.");
    form.reset();
    setOpen(false);
  }

  return (
    <EntityDialog triggerLabel="Nueva venta" title="Crear venta" open={open} onOpenChange={setOpen}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Cliente</span>
          <NativeSelect {...form.register("customerId")}>
            <option value="">Mostrador</option>
            {options.customers.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Total</span>
            <Input type="number" step="0.01" {...form.register("total", { valueAsNumber: true })} />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium">Estado</span>
            <NativeSelect {...form.register("status")}>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </NativeSelect>
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium">Metodo</span>
            <NativeSelect {...form.register("paymentMethod")}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="transfer">Transfer</option>
            </NativeSelect>
          </label>
        </div>
        <div className="flex justify-end">
          <Button type="submit" className="rounded-full px-5" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Guardando..." : "Guardar venta"}
          </Button>
        </div>
      </form>
    </EntityDialog>
  );
}
