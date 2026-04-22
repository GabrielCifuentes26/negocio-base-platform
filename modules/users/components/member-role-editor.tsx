"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import type { RoleListItem } from "@/types/role";

export function MemberRoleEditor({
  membershipId,
  currentRoleId,
  currentRoleName,
  roles,
  onSave,
}: {
  membershipId: string;
  currentRoleId: string | null;
  currentRoleName: string;
  roles: RoleListItem[];
  onSave: (membershipId: string, roleId: string) => Promise<{ error: string | null }>;
}) {
  const [value, setValue] = useState(currentRoleId ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    if (!value || value === currentRoleId) {
      return;
    }

    setSubmitting(true);
    const result = await onSave(membershipId, value);

    if (result.error) {
      toast.error(result.error);
      setSubmitting(false);
      return;
    }

    toast.success("Rol actualizado.");
    setSubmitting(false);
  }

  return (
    <div className="flex min-w-[220px] items-center gap-2">
      <NativeSelect value={value} onChange={(event) => setValue(event.target.value)} className="h-9 rounded-full">
        <option value="">{currentRoleName}</option>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </NativeSelect>
      <Button variant="outline" className="rounded-full px-3" onClick={() => void handleSave()} disabled={submitting}>
        {submitting ? "..." : "Guardar"}
      </Button>
    </div>
  );
}
