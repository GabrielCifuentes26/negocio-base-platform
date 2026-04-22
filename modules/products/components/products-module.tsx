"use client";

import { Package } from "lucide-react";

import { formatCurrency } from "@/lib/format";
import { DataTable } from "@/components/shared/data-table";
import { ModuleCard } from "@/components/shared/module-card";
import { PageShell } from "@/components/shared/page-shell";
import { EmptyState } from "@/components/states/empty-state";
import { ModuleLoader } from "@/components/states/module-loader";
import { CreateProductDialog } from "@/modules/products/components/create-product-dialog";
import { useProducts } from "@/modules/products/lib/use-products";

export function ProductsModule() {
  const { rows, loading, error, mode, addProduct } = useProducts();

  if (loading) {
    return <ModuleLoader />;
  }

  return (
    <PageShell
      title="Productos"
      description="Catalogo de inventario ligero desacoplado del modulo de servicios para soportar retail o consumo interno."
      action={<CreateProductDialog onCreate={addProduct} />}
    >
      <ModuleCard
        title="Inventario base"
        description={`Fuente activa: ${mode === "supabase" ? "Supabase" : "demo local"}. Preparado para crecer hacia movimientos, compras y alertas.`}
      >
        {rows.length > 0 ? (
          <DataTable
            rows={rows}
            columns={[
              { key: "name", label: "Producto" },
              { key: "sku", label: "SKU" },
              { key: "stock", label: "Stock" },
              {
                key: "price",
                label: "Precio",
                render: (row) => formatCurrency(Number(row.price)),
              },
            ]}
          />
        ) : (
          <EmptyState
            icon={Package}
            title="Aun no hay productos"
            description="Agrega inventario inicial para habilitar ventas rapidas y catalogos retail."
          />
        )}
      </ModuleCard>
      {error ? <EmptyState icon={Package} title="No se pudieron cargar los productos" description={error} /> : null}
    </PageShell>
  );
}
