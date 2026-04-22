"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { NativeSelect } from "@/components/ui/native-select";

export function WorkspaceSwitcher({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  const { workspaces, activeBusinessId, switchWorkspace, supabaseEnabled } = useAuth();
  const [switching, setSwitching] = useState(false);

  if (!supabaseEnabled || workspaces.length <= 1) {
    return null;
  }

  async function handleChange(nextBusinessId: string) {
    if (!nextBusinessId || nextBusinessId === activeBusinessId) {
      return;
    }

    setSwitching(true);
    const result = await switchWorkspace(nextBusinessId);
    setSwitching(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    const activeWorkspace = workspaces.find((workspace) => workspace.businessId === nextBusinessId);
    toast.success(`Negocio activo: ${activeWorkspace?.businessName ?? "Actualizado"}.`);
  }

  return (
    <label className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Building2 className="size-4" />
        {!compact ? <span className="text-sm font-medium">Negocio</span> : null}
      </div>
      <NativeSelect
        value={activeBusinessId ?? ""}
        disabled={switching}
        className={compact ? "h-9 min-w-0 rounded-full bg-white text-xs" : "h-9 min-w-[220px] rounded-full bg-white"}
        onChange={(event) => void handleChange(event.target.value)}
      >
        {workspaces.map((workspace) => (
          <option key={workspace.businessId} value={workspace.businessId}>
            {workspace.businessName} - {workspace.role.name}
          </option>
        ))}
      </NativeSelect>
    </label>
  );
}
