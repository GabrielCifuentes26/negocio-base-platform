"use client";

import { KeyRound, ShieldCheck } from "lucide-react";

import { usePermissionAccess } from "@/hooks/use-permission-access";
import { DataTable } from "@/components/shared/data-table";
import { ModuleCard } from "@/components/shared/module-card";
import { PageShell } from "@/components/shared/page-shell";
import { EmptyState } from "@/components/states/empty-state";
import { ModuleLoader } from "@/components/states/module-loader";
import { CreateRoleDialog } from "@/modules/roles/components/create-role-dialog";
import { RolePermissionsEditor } from "@/modules/roles/components/role-permissions-editor";
import { useRoles } from "@/modules/roles/lib/use-roles";

export function RolesModule() {
  const { rows, permissions, mode, loading, error, addRole, saveRolePermissions } = useRoles();
  const { can } = usePermissionAccess();
  const canManageRoles = can("roles.manage");

  if (loading) {
    return <ModuleLoader />;
  }

  return (
    <PageShell
      title="Roles y permisos"
      description="Modelo base para seguridad, RLS y reglas de acceso por tipo de usuario."
      action={canManageRoles ? <CreateRoleDialog permissions={permissions} onCreate={addRole} /> : undefined}
    >
      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <ModuleCard
          title="Matriz de roles"
          description={`Fuente activa: ${mode === "supabase" ? "Supabase" : "demo local"}. Punto de partida para permisos granulares por modulo y accion.`}
        >
          {rows.length > 0 ? (
            <DataTable
              rows={rows}
              columns={[
                { key: "name", label: "Rol" },
                { key: "scope", label: "Alcance" },
                { key: "users", label: "Usuarios" },
                { key: "permissionsCount", label: "Permisos" },
                {
                  key: "actions",
                  label: "Gestion",
                  render: (row) => (
                    canManageRoles ? (
                      <RolePermissionsEditor role={row} permissions={permissions} onSave={saveRolePermissions} />
                    ) : (
                      <span className="text-sm text-muted-foreground">{row.isSystem ? "Sistema" : "Solo lectura"}</span>
                    )
                  ),
                },
              ]}
            />
          ) : (
            <EmptyState
              icon={ShieldCheck}
              title="Aun no hay roles visibles"
              description="Los roles del negocio o los roles de sistema apareceran aqui."
            />
          )}
        </ModuleCard>

        <ModuleCard title="Permisos base" description="Lista reusable que alimenta la creacion de roles personalizados.">
          {permissions.length > 0 ? (
            <div className="space-y-3">
              {permissions.map((permission) => (
                <div key={permission.id} className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                  <p className="font-medium">{permission.key}</p>
                  <p className="text-sm text-muted-foreground">
                    {permission.description ?? `${permission.moduleKey}:${permission.action}`}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={KeyRound}
              title="Aun no hay permisos cargados"
              description="Ejecuta los seeds iniciales para poblar la tabla permissions."
            />
          )}
        </ModuleCard>
      </div>
      {error ? <EmptyState icon={ShieldCheck} title="No se pudieron cargar los roles" description={error} /> : null}
    </PageShell>
  );
}
