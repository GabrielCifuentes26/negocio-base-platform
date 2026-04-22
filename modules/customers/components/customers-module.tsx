"use client";

import { Users } from "lucide-react";

import { DataTable } from "@/components/shared/data-table";
import { ModuleCard } from "@/components/shared/module-card";
import { PageShell } from "@/components/shared/page-shell";
import { EmptyState } from "@/components/states/empty-state";
import { ModuleLoader } from "@/components/states/module-loader";
import { CreateCustomerDialog } from "@/modules/customers/components/create-customer-dialog";
import { useCustomers } from "@/modules/customers/lib/use-customers";

export function CustomersModule() {
  const { rows, loading, error, mode, addCustomer } = useCustomers();

  if (loading) {
    return <ModuleLoader />;
  }

  return (
    <PageShell
      title="Clientes"
      description="Entidad reusable para multiples negocios, sin amarrar campos a un sector especifico."
      action={<CreateCustomerDialog onCreate={addCustomer} />}
    >
      <ModuleCard
        title="Directorio de clientes"
        description={`Fuente activa: ${mode === "supabase" ? "Supabase" : "demo local"}. Ideal para CRM ligero e historial futuro.`}
      >
        {rows.length > 0 ? (
          <DataTable
            rows={rows}
            columns={[
              { key: "name", label: "Nombre" },
              { key: "email", label: "Correo" },
              { key: "phone", label: "Telefono" },
              { key: "visits", label: "Visitas" },
              { key: "lastVisit", label: "Ultima actividad" },
            ]}
          />
        ) : (
          <EmptyState
            icon={Users}
            title="Aun no hay clientes cargados"
            description="Cuando conectes Supabase o agregues un cliente desde este modulo, la tabla empezara a poblarse."
          />
        )}
      </ModuleCard>
      {error ? (
        <EmptyState
          icon={Users}
          title="No se pudieron cargar los clientes"
          description={error}
        />
      ) : null}
      <EmptyState
        icon={Users}
        title="Espacio para historial, etiquetas y notas"
        description="La base ya separa el modulo para agregar fidelizacion, consentimiento, membresias o historial clinico sin contaminar la UI actual."
      />
    </PageShell>
  );
}
