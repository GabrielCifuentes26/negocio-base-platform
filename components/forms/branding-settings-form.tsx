"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImageUp } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { businessConfig } from "@/config/business";
import { useAuth } from "@/hooks/use-auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { uploadBrandAsset, type BrandAssetType } from "@/services/api/storage-service";
import { updateWorkspaceBranding } from "@/services/api/workspace-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const brandingSchema = z.object({
  primaryColor: z.string().min(4),
  primaryForegroundColor: z.string().min(4),
  accentColor: z.string().min(4),
  accentForegroundColor: z.string().min(4),
  sidebarColor: z.string().min(4),
  fontFamily: z.string().min(2),
  logoUrl: z.string().min(1),
  heroImageUrl: z.string().min(1),
});

type BrandingFormValues = z.infer<typeof brandingSchema>;

export function BrandingSettingsForm() {
  const { workspace, refreshWorkspace, supabaseEnabled } = useAuth();
  const business = workspace?.business ?? businessConfig;
  const [uploadingAsset, setUploadingAsset] = useState<BrandAssetType | null>(null);

  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      primaryColor: business.branding.colors.primary,
      primaryForegroundColor: business.branding.colors.primaryForeground,
      accentColor: business.branding.colors.accent,
      accentForegroundColor: business.branding.colors.accentForeground,
      sidebarColor: business.branding.colors.sidebar,
      fontFamily: business.branding.fontFamily,
      logoUrl: business.branding.images.logo,
      heroImageUrl: business.branding.images.hero,
    },
  });

  useEffect(() => {
    form.reset({
      primaryColor: business.branding.colors.primary,
      primaryForegroundColor: business.branding.colors.primaryForeground,
      accentColor: business.branding.colors.accent,
      accentForegroundColor: business.branding.colors.accentForeground,
      sidebarColor: business.branding.colors.sidebar,
      fontFamily: business.branding.fontFamily,
      logoUrl: business.branding.images.logo,
      heroImageUrl: business.branding.images.hero,
    });
  }, [business, form]);

  async function persistBranding(values: BrandingFormValues) {
    if (!supabaseEnabled || !workspace || workspace.mode === "demo") {
      toast.success("Branding validado en modo demo.");
      return { error: null as string | null };
    }

    const client = getSupabaseBrowserClient();

    if (!client) {
      return { error: "No se pudo inicializar Supabase." };
    }

    const result = await updateWorkspaceBranding(client, workspace.businessId, values);

    if (result.error) {
      return { error: result.error };
    }

    await refreshWorkspace();
    return { error: null as string | null };
  }

  async function onSubmit(values: BrandingFormValues) {
    const result = await persistBranding(values);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Branding actualizado.");
  }

  async function handleAssetUpload(assetType: BrandAssetType, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!supabaseEnabled || !workspace || workspace.mode === "demo") {
      toast.error("La subida real de archivos requiere Supabase y un negocio activo.");
      return;
    }

    const client = getSupabaseBrowserClient();

    if (!client) {
      toast.error("No se pudo inicializar Supabase.");
      return;
    }

    setUploadingAsset(assetType);
    const uploadResult = await uploadBrandAsset(client, workspace.businessId, assetType, file);
    setUploadingAsset(null);

    if (uploadResult.error || !uploadResult.publicUrl) {
      toast.error(uploadResult.error ?? "No se pudo subir el archivo.");
      return;
    }

    const values = {
      ...form.getValues(),
      logoUrl: assetType === "logo" ? uploadResult.publicUrl : form.getValues("logoUrl"),
      heroImageUrl: assetType === "hero" ? uploadResult.publicUrl : form.getValues("heroImageUrl"),
    };

    form.setValue(assetType === "logo" ? "logoUrl" : "heroImageUrl", uploadResult.publicUrl, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });

    const persistResult = await persistBranding(values);

    if (persistResult.error) {
      toast.error(persistResult.error);
      return;
    }

    toast.success(assetType === "logo" ? "Logo actualizado." : "Imagen principal actualizada.");
  }

  return (
    <Card className="border-white/70 bg-white/80">
      <CardContent className="p-5">
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Color primario</span>
              <Input {...form.register("primaryColor")} />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Color texto primario</span>
              <Input {...form.register("primaryForegroundColor")} />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Color acento</span>
              <Input {...form.register("accentColor")} />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Color texto acento</span>
              <Input {...form.register("accentForegroundColor")} />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Color sidebar</span>
              <Input {...form.register("sidebarColor")} />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Tipografia</span>
              <Input {...form.register("fontFamily")} />
            </label>
          </div>
          <label className="space-y-2 text-sm">
            <span className="font-medium">URL logo</span>
            <Input {...form.register("logoUrl")} />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium">URL imagen hero</span>
            <Input {...form.register("heroImageUrl")} />
          </label>

          <div className="grid gap-4 rounded-3xl border border-dashed border-border/80 bg-muted/20 p-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Subir logo</span>
              <Input type="file" accept="image/*" onChange={(event) => void handleAssetUpload("logo", event)} />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium">Subir imagen principal</span>
              <Input type="file" accept="image/*" onChange={(event) => void handleAssetUpload("hero", event)} />
            </label>
            <div className="sm:col-span-2 rounded-2xl bg-white/80 px-4 py-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <ImageUp className="size-4" />
                Assets con Supabase Storage
              </div>
              <p className="mt-1">
                Los archivos se suben al bucket publico del negocio y el branding se actualiza al terminar la carga.
              </p>
              {uploadingAsset ? <p className="mt-2 text-primary">Subiendo {uploadingAsset}...</p> : null}
            </div>
          </div>

          <Button className="rounded-full px-5" type="submit" disabled={form.formState.isSubmitting || Boolean(uploadingAsset)}>
            {form.formState.isSubmitting ? "Guardando..." : "Guardar branding"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
