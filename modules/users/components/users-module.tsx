"use client";

import { Users } from "lucide-react";

import { usePermissionAccess } from "@/hooks/use-permission-access";
import { formatJoinedAt } from "@/services/api/team-service";
import { DataTable } from "@/components/shared/data-table";
import { ModuleCard } from "@/components/shared/module-card";
import { PageShell } from "@/components/shared/page-shell";
import { EmptyState } from "@/components/states/empty-state";
import { ModuleLoader } from "@/components/states/module-loader";
import { InvitationsPanel } from "@/modules/users/components/invitations-panel";
import { MemberRoleEditor } from "@/modules/users/components/member-role-editor";
import { useUsers } from "@/modules/users/lib/use-users";

export function UsersModule() {
  const { rows, roles, mode, loading, error, changeRole } = useUsers();
  const { can } = usePermissionAccess();
  const canManageUsers = can("manage_users");

  if (loading) {
    return <ModuleLoader />;
  }

  return (
    <PageShell
      title="Usuarios y empleados"
      description="Gestion de personas internas con base lista para auth, perfil y asignacion por negocio."
    >
      <ModuleCard
        title="Equipo activo"
        description={`Fuente activa: ${mode === "supabase" ? "Supabase" : "demo local"}. Separado del auth provider para soportar membresias multi-negocio.`}
      >
        {rows.length > 0 ? (
          <DataTable
            rows={rows}
            columns={[
              { key: "name", label: "Nombre" },
              { key: "email", label: "Correo" },
              {
                key: "role",
                label: "Rol",
                render: (row) =>
                  canManageUsers ? (
                    <MemberRoleEditor
                      membershipId={row.membershipId}
                      currentRoleId={row.roleId}
                      currentRoleName={row.role}
                      roles={roles}
                      onSave={changeRole}
                    />
                  ) : (
                    row.role
                  ),
              },
              { key: "status", label: "Estado" },
              {
                key: "joinedAt",
                label: "Alta",
                render: (row) => formatJoinedAt(row.joinedAt),
              },
            ]}
          />
        ) : (
          <EmptyState
            icon={Users}
            title="Aun no hay miembros cargados"
            description="Los usuarios con membresia activa en el negocio apareceran aqui."
          />
        )}
      </ModuleCard>
      <ModuleCard
        title="Invitaciones"
        description="Base de onboarding del equipo. El envio de correo puede agregarse despues con Edge Functions."
      >
        {canManageUsers ? (
          <InvitationsPanel roles={roles} />
        ) : (
          <EmptyState
            icon={Users}
            title="Gestion restringida"
            description="Tu rol actual puede ver el equipo, pero no administrar asignaciones de acceso."
          />
        )}
      </ModuleCard>
      {error ? <EmptyState icon={Users} title="No se pudo cargar el equipo" description={error} /> : null}
    </PageShell>
  );
}
