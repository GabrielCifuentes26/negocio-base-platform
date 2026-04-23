"use client";

import { ReceiptText } from "lucide-react";

import { formatCurrency } from "@/lib/format";
import { usePermissionAccess } from "@/hooks/use-permission-access";
import { DataTable } from "@/components/shared/data-table";
import { ModuleCard } from "@/components/shared/module-card";
import { PageShell } from "@/components/shared/page-shell";
import { EmptyState } from "@/components/states/empty-state";
import { ModuleLoader } from "@/components/states/module-loader";
import { CreateSaleDialog } from "@/modules/sales/components/create-sale-dialog";
import { useSales } from "@/modules/sales/lib/use-sales";

export function SalesModule() {
  const { rows, options, loading, error, mode, addSale } = useSales();
  const { can } = usePermissionAccess();
  const canCreateSales = can("sales.create");

  if (loading) {
    return <ModuleLoader />;
  }

  return (
    <PageShell
      title="Ventas"
      description="Base de cobro y facturacion ligera preparada para tickets, items y metodos de pago."
      action={canCreateSales ? <CreateSaleDialog options={options} onCreate={addSale} /> : undefined}
    >
      <ModuleCard
        title="Transacciones recientes"
        description={`Fuente activa: ${mode === "supabase" ? "Supabase" : "demo local"}. Diseno base para escritorio y movil con datos financieros claros.`}
      >
        {rows.length > 0 ? (
          <DataTable
            rows={rows}
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
            icon={ReceiptText}
            title="Aun no hay ventas"
            description="Registra una venta para empezar a alimentar indicadores y flujo comercial."
          />
        )}
      </ModuleCard>
      {!canCreateSales ? (
        <EmptyState
          icon={ReceiptText}
          title="Acceso en modo lectura"
          description="Tu rol actual puede consultar ventas, pero no registrar nuevas transacciones."
        />
      ) : null}
      {error ? <EmptyState icon={ReceiptText} title="No se pudieron cargar las ventas" description={error} /> : null}
    </PageShell>
  );
}
