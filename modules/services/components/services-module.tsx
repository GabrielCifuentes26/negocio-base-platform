"use client";

import { BrushCleaning } from "lucide-react";

import { formatCurrency } from "@/lib/format";
import { DataTable } from "@/components/shared/data-table";
import { ModuleCard } from "@/components/shared/module-card";
import { PageShell } from "@/components/shared/page-shell";
import { EmptyState } from "@/components/states/empty-state";
import { ModuleLoader } from "@/components/states/module-loader";
import { CreateServiceDialog } from "@/modules/services/components/create-service-dialog";
import { useServices } from "@/modules/services/lib/use-services";

export function ServicesModule() {
  const { rows, loading, error, mode, addService } = useServices();

  if (loading) {
    return <ModuleLoader />;
  }

  return (
    <PageShell
      title="Servicios"
      description="Catalogo independiente para negocios orientados a tiempo, recursos y personal."
      action={<CreateServiceDialog onCreate={addService} />}
    >
      <ModuleCard
        title="Catalogo de servicios"
        description={`Fuente activa: ${mode === "supabase" ? "Supabase" : "demo local"}. Base lista para duracion, precio y categorias futuras.`}
      >
        {rows.length > 0 ? (
          <DataTable
            rows={rows}
            columns={[
              { key: "name", label: "Servicio" },
              {
                key: "price",
                label: "Precio",
                render: (row) => formatCurrency(Number(row.price)),
              },
              {
                key: "durationMinutes",
                label: "Duracion",
                render: (row) => `${row.durationMinutes} min`,
              },
              { key: "status", label: "Estado" },
            ]}
          />
        ) : (
          <EmptyState
            icon={BrushCleaning}
            title="Aun no hay servicios"
            description="Crea tu primer servicio para empezar a poblar agenda, ventas y reportes."
          />
        )}
      </ModuleCard>
      {error ? <EmptyState icon={BrushCleaning} title="No se pudieron cargar los servicios" description={error} /> : null}
    </PageShell>
  );
}
