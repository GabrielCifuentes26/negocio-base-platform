"use client";

import { useState } from "react";
import { BarChart3, CalendarRange, Coins, Users } from "lucide-react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { businessConfig } from "@/config/business";
import { formatCurrency } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
import { useDashboard } from "@/modules/dashboard/lib/use-dashboard";
import { downloadDashboardSnapshotCsv } from "@/services/export/report-export";
import { ModuleCard } from "@/components/shared/module-card";
import { PageShell } from "@/components/shared/page-shell";
import { EmptyState } from "@/components/states/empty-state";
import { ModuleLoader } from "@/components/states/module-loader";
import { Button } from "@/components/ui/button";

export function ReportsModule() {
  const { workspace } = useAuth();
  const business = workspace?.business ?? businessConfig;
  const { snapshot, loading } = useDashboard();
  const [exporting, setExporting] = useState(false);

  function handleExport() {
    setExporting(true);
    const success = downloadDashboardSnapshotCsv(snapshot, business.name);
    setExporting(false);

    if (!success) {
      toast.error("La exportacion CSV solo esta disponible en navegador.");
      return;
    }

    toast.success("Reporte exportado en CSV.");
  }

  if (loading) {
    return <ModuleLoader />;
  }

  return (
    <PageShell
      title="Reportes basicos"
      description="Indicadores iniciales para decisiones rapidas, listos para ampliarse a vistas analiticas mas profundas."
      action={
        <Button variant="outline" className="rounded-full px-5" onClick={handleExport} disabled={exporting}>
          <Download />
          {exporting ? "Exportando..." : "Exportar CSV"}
        </Button>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ModuleCard title="Ingresos" description={`Moneda activa: ${business.currency.code}.`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-3xl font-semibold">{formatCurrency(snapshot.metrics.revenue)}</p>
              <p className="mt-2 text-sm text-muted-foreground">Fuente: {snapshot.mode}</p>
            </div>
            <Coins className="size-5 text-primary" />
          </div>
        </ModuleCard>
        <ModuleCard title="Clientes activos" description="Vision de actividad reciente.">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-3xl font-semibold">{snapshot.metrics.activeCustomers}</p>
              <p className="mt-2 text-sm text-muted-foreground">Base actual del negocio</p>
            </div>
            <Users className="size-5 text-primary" />
          </div>
        </ModuleCard>
        <ModuleCard title="Citas de hoy" description="Pulso operativo del dia.">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-3xl font-semibold">{snapshot.metrics.appointmentsToday}</p>
              <p className="mt-2 text-sm text-muted-foreground">Reservas del dia actual</p>
            </div>
            <CalendarRange className="size-5 text-primary" />
          </div>
        </ModuleCard>
        <ModuleCard title="Conversion" description="Relacion entre ventas y agenda.">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-3xl font-semibold">{snapshot.metrics.conversionRate}%</p>
              <p className="mt-2 text-sm text-muted-foreground">Indicador comercial base</p>
            </div>
            <BarChart3 className="size-5 text-primary" />
          </div>
        </ModuleCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ModuleCard title="Ingresos por dia" description="Lectura simple de tendencia para la operacion.">
          <div className="space-y-3">
            {snapshot.trend.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(item.revenue)}</p>
              </div>
            ))}
          </div>
        </ModuleCard>

        <ModuleCard title="Lectura ejecutiva" description="Resumen rapido para toma de decisiones.">
          {snapshot.sales.length > 0 || snapshot.appointments.length > 0 ? (
            <div className="space-y-3">
              <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                <p className="text-sm font-medium">Ventas registradas</p>
                <p className="mt-1 text-2xl font-semibold">{snapshot.sales.length}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                <p className="text-sm font-medium">Actividad en agenda</p>
                <p className="mt-1 text-2xl font-semibold">{snapshot.appointments.length}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                <p className="text-sm font-medium">Negocio observado</p>
                <p className="mt-1 text-base font-semibold">{business.name}</p>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="Aun no hay suficiente actividad"
              description="Cuando empieces a registrar ventas y reservas, este modulo mostrara mejor lectura operativa."
            />
          )}
        </ModuleCard>
      </div>
    </PageShell>
  );
}
