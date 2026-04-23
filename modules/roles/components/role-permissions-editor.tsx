"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { PermissionKey } from "@/types/auth";
import type { PermissionListItem, RoleListItem } from "@/types/role";

function groupPermissionsByModule(permissions: PermissionListItem[]) {
  return permissions.reduce<Record<string, PermissionListItem[]>>((groups, permission) => {
    groups[permission.moduleKey] = [...(groups[permission.moduleKey] ?? []), permission];
    return groups;
  }, {});
}

export function RolePermissionsEditor({
  role,
  permissions,
  onSave,
}: {
  role: RoleListItem;
  permissions: PermissionListItem[];
  onSave: (roleId: string, permissionKeys: PermissionKey[]) => Promise<{ error: string | null }>;
}) {
  const [open, setOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<PermissionKey[]>(role.permissionKeys);
  const [saving, setSaving] = useState(false);

  const groupedPermissions = useMemo(() => groupPermissionsByModule(permissions), [permissions]);

  function togglePermission(permissionKey: PermissionKey) {
    setSelectedKeys((current) =>
      current.includes(permissionKey)
        ? current.filter((item) => item !== permissionKey)
        : [...current, permissionKey],
    );
  }

  async function handleSave() {
    setSaving(true);
    const result = await onSave(role.id, selectedKeys);
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Permisos del rol actualizados.");
    setOpen(false);
  }

  if (role.isSystem) {
    return <Badge variant="outline">Sistema</Badge>;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (nextOpen) {
          setSelectedKeys(role.permissionKeys);
        }
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm">Editar permisos</Button>} />
      <DialogContent className="max-w-2xl rounded-[1.75rem] border-white/70 bg-white p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{role.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 px-6 pb-6">
          <p className="text-sm text-muted-foreground">
            Ajusta el acceso del rol por permisos base. Los cambios se aplican solo a roles personalizados del negocio.
          </p>

          <div className="space-y-4">
            {Object.entries(groupedPermissions).map(([moduleKey, modulePermissions]) => (
              <div key={moduleKey} className="rounded-3xl border border-border/70 bg-muted/20 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-medium capitalize">{moduleKey}</p>
                  <Badge variant="secondary">{modulePermissions.length} permisos</Badge>
                </div>
                <div className="grid gap-2">
                  {modulePermissions.map((permission) => {
                    const checked = selectedKeys.includes(permission.key);

                    return (
                      <label
                        key={permission.id}
                        className="flex items-start gap-3 rounded-2xl border border-border/70 bg-white px-3 py-3 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePermission(permission.key)}
                          className="mt-1 size-4 rounded border-border"
                        />
                        <span>
                          <span className="block font-medium">{permission.key}</span>
                          <span className="block text-muted-foreground">
                            {permission.description ?? `${permission.moduleKey}:${permission.action}`}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" className="rounded-full px-5" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button className="rounded-full px-5" onClick={() => void handleSave()} disabled={saving}>
              {saving ? "Guardando..." : "Guardar permisos"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
