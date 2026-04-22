"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { businessConfig } from "@/config/business";
import { useAuth } from "@/hooks/use-auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { updateWorkspaceBusiness } from "@/services/api/workspace-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const businessSettingsSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  phone: z.string().min(8),
  address: z.string().min(5),
  welcomeMessage: z.string().min(8),
});

type BusinessSettingsValues = z.infer<typeof businessSettingsSchema>;

export function BusinessSettingsForm() {
  const { workspace, refreshWorkspace, supabaseEnabled } = useAuth();
  const business = workspace?.business ?? businessConfig;

  const form = useForm<BusinessSettingsValues>({
    resolver: zodResolver(businessSettingsSchema),
    defaultValues: {
      name: business.name,
      email: business.contact.email,
      phone: business.contact.phone,
      address: business.contact.address,
      welcomeMessage: business.texts.welcomeMessage,
    },
  });

  useEffect(() => {
    form.reset({
      name: business.name,
      email: business.contact.email,
      phone: business.contact.phone,
      address: business.contact.address,
      welcomeMessage: business.texts.welcomeMessage,
    });
  }, [business, form]);

  async function onSubmit(values: BusinessSettingsValues) {
    if (!supabaseEnabled || !workspace || workspace.mode === "demo") {
      toast.success("Configuracion validada en modo demo.");
      return;
    }

    const client = getSupabaseBrowserClient();

    if (!client) {
      toast.error("No se pudo inicializar Supabase.");
      return;
    }

    const result = await updateWorkspaceBusiness(client, workspace.businessId, values);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    await refreshWorkspace();
    toast.success("Configuracion del negocio actualizada.");
  }

  return (
    <Card className="border-white/70 bg-white/80">
      <CardContent className="p-5">
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Nombre comercial</span>
              <Input {...form.register("name")} />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Correo</span>
              <Input {...form.register("email")} />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Telefono</span>
              <Input {...form.register("phone")} />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Direccion</span>
              <Input {...form.register("address")} />
            </label>
          </div>
          <label className="space-y-2 text-sm">
            <span className="font-medium">Mensaje de bienvenida</span>
            <Textarea rows={4} {...form.register("welcomeMessage")} />
          </label>
          <Button className="rounded-full px-5" type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Guardando..." : "Guardar cambios"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
