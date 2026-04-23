"use client";

import { CalendarRange } from "lucide-react";

import { usePermissionAccess } from "@/hooks/use-permission-access";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { ModuleCard } from "@/components/shared/module-card";
import { PageShell } from "@/components/shared/page-shell";
import { EmptyState } from "@/components/states/empty-state";
import { ModuleLoader } from "@/components/states/module-loader";
import { CreateAppointmentDialog } from "@/modules/appointments/components/create-appointment-dialog";
import { useAppointments } from "@/modules/appointments/lib/use-appointments";

export function AppointmentsModule() {
  const { rows, options, loading, error, mode, addAppointment } = useAppointments();
  const { can } = usePermissionAccess();
  const canCreateAppointments = can("appointments.create");

  if (loading) {
    return <ModuleLoader />;
  }

  return (
    <PageShell
      title="Reservas y citas"
      description="Agenda reusable para negocios con atencion por horario, recurso o empleado."
      action={canCreateAppointments ? <CreateAppointmentDialog options={options} onCreate={addAppointment} /> : undefined}
    >
      <ModuleCard
        title="Agenda activa"
        description={`Fuente activa: ${mode === "supabase" ? "Supabase" : "demo local"}. Estados, horarios y responsables en una estructura facil de escalar.`}
      >
        {rows.length > 0 ? (
          <DataTable
            rows={rows}
            columns={[
              { key: "time", label: "Hora" },
              { key: "customer", label: "Cliente" },
              {
                key: "service",
                label: "Servicios",
                render: (row) => (
                  <div className="space-y-1">
                    <p>{row.service}</p>
                    {row.serviceCount > 1 ? <Badge variant="outline">{row.serviceCount} servicios</Badge> : null}
                  </div>
                ),
              },
              { key: "employee", label: "Empleado" },
              { key: "status", label: "Estado" },
            ]}
          />
        ) : (
          <EmptyState
            icon={CalendarRange}
            title="Aun no hay reservas"
            description="Crea la primera reserva para activar la agenda operativa del negocio."
          />
        )}
      </ModuleCard>
      {!canCreateAppointments ? (
        <EmptyState
          icon={CalendarRange}
          title="Acceso en modo lectura"
          description="Tu rol actual puede consultar la agenda, pero no crear nuevas reservas."
        />
      ) : null}
      {error ? <EmptyState icon={CalendarRange} title="No se pudieron cargar las reservas" description={error} /> : null}
    </PageShell>
  );
}
