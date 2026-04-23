"use client";

import { businessConfig } from "@/config/business";
import { usePermissionAccess } from "@/hooks/use-permission-access";
import { useAuth } from "@/hooks/use-auth";
import { BusinessModulesForm } from "@/components/forms/business-modules-form";
import { BusinessSettingsForm } from "@/components/forms/business-settings-form";
import { ModuleCard } from "@/components/shared/module-card";
import { PageShell } from "@/components/shared/page-shell";

export function SettingsModule() {
  const { workspace } = useAuth();
  const { can } = usePermissionAccess();
  const business = workspace?.business ?? businessConfig;
  const canEditSettings = can("settings.update");

  return (
    <PageShell
      title="Configuracion del negocio"
      description="Todos los valores comerciales y operativos viven centralizados, no hardcodeados en componentes."
    >
      <BusinessSettingsForm readOnly={!canEditSettings} />
      <ModuleCard title="Modulos activos" description="Controla que partes del producto se muestran para este negocio.">
        <BusinessModulesForm readOnly={!canEditSettings} />
      </ModuleCard>
      <ModuleCard title="Horario operativo" description="La configuracion de atencion se mantiene centralizada y reusable.">
        <div className="grid gap-3 sm:grid-cols-2">
          {business.hours.map((slot) => (
            <div key={slot.day} className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
              <p className="font-medium">{slot.day}</p>
              <p className="text-sm text-muted-foreground">
                {slot.enabled ? `${slot.opensAt} - ${slot.closesAt}` : "Cerrado"}
              </p>
            </div>
          ))}
        </div>
      </ModuleCard>
    </PageShell>
  );
}
