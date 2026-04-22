"use client";

import { CalendarRange, Coins, TrendingUp, Users } from "lucide-react";

import { businessConfig } from "@/config/business";
import { formatCurrency } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
import { useDashboard } from "@/modules/dashboard/lib/use-dashboard";
import { DataTable } from "@/components/shared/data-table";
import { ModuleCard } from "@/components/shared/module-card";
import { PageShell } from "@/components/shared/page-shell";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/states/empty-state";
import { ModuleLoader } from "@/components/states/module-loader";
import { Badge } from "@/components/ui/badge";

export function DashboardOverview() {
  const { workspace } = useAuth();
  const business = workspace?.business ?? businessConfig;
  const { snapshot, loading } = useDashboard();
  const maxRevenue = Math.max(...snapshot.trend.map((item) => item.revenue), 1);

  if (loading) {
    return <ModuleLoader />;
  }

  return (
    <PageShell title="Dashboard" description={business.texts.dashboardHeadline} actionLabel="Crear venta rapida">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ingresos semanales"
          value={formatCurrency(snapshot.metrics.revenue)}
          hint={`Fuente: ${snapshot.mode === "supabase" ? "Supabase" : "demo local"}`}
          icon={Coins}
        />
        <StatCard
          label="Citas para hoy"
          value={String(snapshot.metrics.appointmentsToday)}
          hint="Entre confirmadas y en curso"
          icon={CalendarRange}
        />
        <StatCard
          label="Clientes activos"
          value={String(snapshot.metrics.activeCustomers)}
          hint="Con actividad en la base actual"
          icon={Users}
        />
        <StatCard
          label="Conversion"
          value={`${snapshot.metrics.conversionRate}%`}
          hint="Relacion ventas / citas"
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <ModuleCard
          title="Tendencia de ingresos"
          description="Componente listo para conectar a agregaciones mas avanzadas o vistas materializadas."
        >
          <div className="space-y-4">
            {snapshot.trend.map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-muted-foreground">{formatCurrency(item.revenue)}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted/60">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ModuleCard>

        <ModuleCard title="Estado de la jornada" description="Resumen rapido para usuarios no tecnicos desde movil o escritorio.">
          {snapshot.appointments.length > 0 ? (
            <div className="space-y-3">
              {snapshot.appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/30 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{appointment.customer}</p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.service} con {appointment.employee}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{appointment.time}</p>
                    <Badge variant="secondary">{appointment.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CalendarRange}
              title="Aun no hay actividad en agenda"
              description="Las citas recientes apareceran aqui cuando el modulo de reservas empiece a operar."
            />
          )}
        </ModuleCard>
      </div>

      <ModuleCard title="Ventas recientes" description="Tabla base reutilizable para tickets, pagos y estados.">
        {snapshot.sales.length > 0 ? (
          <DataTable
            rows={snapshot.sales}
            columns={[
              { key: "ticket", label: "Ticket" },
              { key: "customer", label: "Cliente" },
              {
                key: "total",
                label: "Total",
                render: (row) => formatCurrency(Number(row.total)),
              },
              { key: "status", label: "Estado" },
            ]}
          />
        ) : (
          <EmptyState
            icon={Coins}
            title="Aun no hay ventas registradas"
            description="Las ventas recientes del negocio apareceran aqui apenas se registren transacciones."
          />
        )}
      </ModuleCard>
    </PageShell>
  );
}
