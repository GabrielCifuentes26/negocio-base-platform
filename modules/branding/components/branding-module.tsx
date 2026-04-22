"use client";

import Image from "next/image";

import { businessConfig } from "@/config/business";
import { useAuth } from "@/hooks/use-auth";
import { BrandingSettingsForm } from "@/components/forms/branding-settings-form";
import { ModuleCard } from "@/components/shared/module-card";
import { PageShell } from "@/components/shared/page-shell";

export function BrandingModule() {
  const { workspace } = useAuth();
  const business = workspace?.business ?? businessConfig;

  return (
    <PageShell
      title="Branding y tema"
      description="La identidad visual del cliente se controla desde un solo lugar para reusar la misma base en multiples implementaciones."
    >
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <BrandingSettingsForm />
          <ModuleCard title="Tokens activos" description="Colores, tipografia e imagen sin valores de negocio embebidos en la UI.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border bg-white p-4">
                <p className="mb-3 text-sm font-medium">Colores base</p>
                <div className="grid gap-3">
                  {Object.entries(business.branding.colors).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between rounded-2xl bg-muted/30 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium capitalize">{key}</p>
                        <p className="text-xs text-muted-foreground">{value}</p>
                      </div>
                      <div className="size-9 rounded-full border" style={{ backgroundColor: value }} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border bg-white p-4">
                <p className="mb-3 text-sm font-medium">Tipografia y marca</p>
                <p className="text-sm text-muted-foreground">Fuente principal: {business.branding.fontFamily}</p>
                <div className="mt-6 rounded-[1.75rem] bg-primary px-5 py-8 text-primary-foreground">
                  <p className="text-xs uppercase tracking-[0.24em] opacity-80">Vista rapida</p>
                  <p className="mt-3 text-3xl font-semibold">{business.name}</p>
                  <p className="mt-2 text-sm opacity-80">{business.texts.welcomeMessage}</p>
                </div>
              </div>
            </div>
          </ModuleCard>
        </div>
        <ModuleCard title="Assets de marca" description="Referencias de logo e imagenes centralizadas en la configuracion del negocio.">
          <div className="space-y-4">
            <div className="rounded-3xl border bg-white p-4">
              <p className="mb-3 text-sm font-medium">Logo actual</p>
              <Image
                src={business.branding.images.logo}
                alt="Logo actual"
                width={120}
                height={120}
                className="rounded-2xl border"
              />
            </div>
            <div className="overflow-hidden rounded-[1.75rem] border bg-white p-4">
              <p className="mb-3 text-sm font-medium">Imagen hero</p>
              <Image
                src={business.branding.images.hero}
                alt="Imagen principal"
                width={720}
                height={420}
                className="rounded-2xl border object-cover"
              />
            </div>
          </div>
        </ModuleCard>
      </div>
    </PageShell>
  );
}
