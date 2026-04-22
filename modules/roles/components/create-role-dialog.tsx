"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { EntityDialog } from "@/components/shared/entity-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CreateRoleInput, PermissionListItem } from "@/types/role";

const roleSchema = z.object({
  name: z.string().min(2),
  key: z.string().min(2),
  description: z.string().optional(),
  permissionKeys: z.array(z.string()),
});

type RoleFormValues = z.infer<typeof roleSchema>;

export function CreateRoleDialog({
  permissions,
  onCreate,
}: {
  permissions: PermissionListItem[];
  onCreate: (input: CreateRoleInput) => Promise<{ error: string | null }>;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      key: "",
      description: "",
      permissionKeys: [],
    },
  });

  const selectedPermissions = useWatch({
    control: form.control,
    name: "permissionKeys",
    defaultValue: [],
  });

  function togglePermission(permissionKey: string) {
    const current = form.getValues("permissionKeys");
    const next = current.includes(permissionKey)
      ? current.filter((item) => item !== permissionKey)
      : [...current, permissionKey];

    form.setValue("permissionKeys", next, { shouldValidate: true });
  }

  async function onSubmit(values: RoleFormValues) {
    const result = await onCreate(values);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Rol guardado correctamente.");
    form.reset();
    setOpen(false);
  }

  return (
    <EntityDialog triggerLabel="Nuevo rol" title="Crear rol" open={open} onOpenChange={setOpen}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Nombre</span>
            <Input {...form.register("name")} />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium">Key</span>
            <Input {...form.register("key")} placeholder="assistant_manager" />
          </label>
        </div>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Descripcion</span>
          <Textarea rows={3} {...form.register("description")} />
        </label>
        <div className="space-y-3">
          <p className="text-sm font-medium">Permisos base</p>
          <div className="grid gap-2">
            {permissions.map((permission) => {
              const checked = selectedPermissions.includes(permission.key);

              return (
                <label
                  key={permission.id}
                  className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/20 px-3 py-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePermission(permission.key)}
                    className="mt-1 size-4 rounded border-border"
                  />
                  <span>
                    <span className="block font-medium">{permission.key}</span>
                    <span className="block text-muted-foreground">
                      {permission.description ?? `${permission.moduleKey}:${permission.action}`}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" className="rounded-full px-5" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Guardando..." : "Guardar rol"}
          </Button>
        </div>
      </form>
    </EntityDialog>
  );
}
