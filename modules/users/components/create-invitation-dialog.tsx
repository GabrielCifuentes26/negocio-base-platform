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
import type { CreateInvitationInput } from "@/types/invitation";
import type { RoleListItem } from "@/types/role";

const invitationSchema = z.object({
  email: z.email(),
  fullName: z.string().optional(),
  roleId: z.string().min(1),
  notes: z.string().optional(),
});

type InvitationFormValues = z.infer<typeof invitationSchema>;

export function CreateInvitationDialog({
  roles,
  onCreate,
}: {
  roles: RoleListItem[];
  onCreate: (
    input: CreateInvitationInput,
  ) => Promise<{ error: string | null; inviteLink: string | null; emailDeliveryError: string | null }>;
}) {
  const [open, setOpen] = useState(false);
  const form = useForm<InvitationFormValues>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      email: "",
      fullName: "",
      roleId: "",
      notes: "",
    },
  });

  async function onSubmit(values: InvitationFormValues) {
    const result = await onCreate({
      email: values.email,
      fullName: values.fullName || undefined,
      roleId: values.roleId,
      notes: values.notes || undefined,
    });

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.inviteLink && typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(result.inviteLink);
        toast.success(result.emailDeliveryError ? "Invitacion registrada y enlace copiado." : "Invitacion registrada, correo enviado y enlace copiado.");
      } catch {
        toast.success(result.emailDeliveryError ? "Invitacion registrada." : "Invitacion registrada y correo enviado.");
      }
    } else {
      toast.success(result.emailDeliveryError ? "Invitacion registrada." : "Invitacion registrada y correo enviado.");
    }

    if (result.emailDeliveryError) {
      toast.warning(`No se pudo enviar el correo automatico: ${result.emailDeliveryError}`);
    }

    form.reset();
    setOpen(false);
  }

  return (
    <EntityDialog triggerLabel="Nueva invitacion" title="Crear invitacion" open={open} onOpenChange={setOpen}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Correo</span>
          <Input {...form.register("email")} />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Nombre</span>
          <Input {...form.register("fullName")} />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Rol asignado</span>
          <NativeSelect {...form.register("roleId")}>
            <option value="">Selecciona un rol</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </NativeSelect>
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Notas</span>
          <Textarea rows={3} {...form.register("notes")} />
        </label>
        <div className="flex justify-end">
          <Button type="submit" className="rounded-full px-5" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Guardando..." : "Guardar invitacion"}
          </Button>
        </div>
      </form>
    </EntityDialog>
  );
}
