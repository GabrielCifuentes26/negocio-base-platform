"use client";

import { Copy, MailPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/states/empty-state";
import { ModuleLoader } from "@/components/states/module-loader";
import { Button } from "@/components/ui/button";
import { CreateInvitationDialog } from "@/modules/users/components/create-invitation-dialog";
import { useInvitations } from "@/modules/users/lib/use-invitations";
import type { RoleListItem } from "@/types/role";

export function InvitationsPanel({ roles }: { roles: RoleListItem[] }) {
  const { rows, loading, error, addInvitation, removeInvitation } = useInvitations();

  async function handleCancel(invitationId: string) {
    const result = await removeInvitation(invitationId);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Invitacion cancelada.");
  }

  async function handleCopyLink(inviteLink: string) {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast.error("Tu navegador no permite copiar el enlace automaticamente.");
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Enlace de invitacion copiado.");
    } catch {
      toast.error("No se pudo copiar el enlace.");
    }
  }

  if (loading) {
    return <ModuleLoader />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Registra invitaciones pendientes antes de automatizar el envio por correo.
        </p>
        <CreateInvitationDialog roles={roles} onCreate={addInvitation} />
      </div>

      {rows.length > 0 ? (
        <div className="space-y-3">
          {rows.map((invitation) => (
            <div
              key={invitation.id}
              className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{invitation.fullName || invitation.email}</p>
                <p className="text-sm text-muted-foreground">{invitation.email} - {invitation.roleName}</p>
                <p className="text-xs text-muted-foreground">
                  Estado: {invitation.status} - Creada: {formatDate(invitation.createdAt)} - Expira:{" "}
                  {invitation.expiresAt ? formatDate(invitation.expiresAt) : "Sin fecha"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  className="rounded-full px-4"
                  onClick={() => void handleCopyLink(invitation.inviteLink)}
                >
                  <Copy />
                  Copiar enlace
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full px-4 text-destructive"
                  onClick={() => void handleCancel(invitation.id)}
                >
                  <Trash2 />
                  Cancelar
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={MailPlus}
          title="Aun no hay invitaciones pendientes"
          description="Crea invitaciones internas para llevar control del onboarding de personal."
        />
      )}

      {error ? <EmptyState icon={MailPlus} title="No se pudieron cargar las invitaciones" description={error} /> : null}
    </div>
  );
}
