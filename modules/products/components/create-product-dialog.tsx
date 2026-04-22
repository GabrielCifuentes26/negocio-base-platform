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
import type { CreateProductInput } from "@/types/product";

const productSchema = z.object({
  name: z.string().min(2),
  sku: z.string().optional(),
  stock: z.number().min(0),
  price: z.number().min(0),
  description: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export function CreateProductDialog({
  onCreate,
}: {
  onCreate: (input: CreateProductInput) => Promise<{ error: string | null }>;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      stock: 0,
      price: 0,
      description: "",
    },
  });

  async function onSubmit(values: ProductFormValues) {
    const result = await onCreate(values);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Producto guardado correctamente.");
    form.reset();
    setOpen(false);
  }

  return (
    <EntityDialog triggerLabel="Nuevo producto" title="Crear producto" open={open} onOpenChange={setOpen}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Nombre</span>
          <Input {...form.register("name")} />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-2 text-sm">
            <span className="font-medium">SKU</span>
            <Input {...form.register("sku")} />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium">Stock</span>
            <Input type="number" {...form.register("stock", { valueAsNumber: true })} />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium">Precio</span>
            <Input type="number" step="0.01" {...form.register("price", { valueAsNumber: true })} />
          </label>
        </div>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Descripcion</span>
          <Textarea rows={4} {...form.register("description")} />
        </label>
        <div className="flex justify-end">
          <Button type="submit" className="rounded-full px-5" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Guardando..." : "Guardar producto"}
          </Button>
        </div>
      </form>
    </EntityDialog>
  );
}
