"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { createRole, listRoles, updateRolePermissions } from "@/services/api/role-service";
import type { CreateRoleInput, PermissionListItem, RoleListItem } from "@/types/role";

export function useRoles() {
  const { workspace, supabaseEnabled, status } = useAuth();
  const [rows, setRows] = useState<RoleListItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionListItem[]>([]);
  const [mode, setMode] = useState<"demo" | "supabase">(supabaseEnabled ? "supabase" : "demo");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    const result = await listRoles(workspace?.businessId);
    setRows(result.rows);
    setPermissions(result.permissions);
    setMode(result.mode);
    setError(result.error);
    setLoading(false);
  }

  useEffect(() => {
    if (supabaseEnabled && status === "loading") {
      return;
    }

    let isActive = true;

    void listRoles(workspace?.businessId).then((result) => {
      if (!isActive) {
        return;
      }

      setRows(result.rows);
      setPermissions(result.permissions);
      setMode(result.mode);
      setError(result.error);
      setLoading(false);
    });

    return () => {
      isActive = false;
    };
  }, [status, supabaseEnabled, workspace?.businessId]);

  async function addRole(input: CreateRoleInput) {
    const result = await createRole(workspace?.businessId, input);

    if (result.error) {
      return { error: result.error };
    }

    await reload();
    return { error: null };
  }

  async function saveRolePermissions(roleId: string, permissionKeys: string[]) {
    const result = await updateRolePermissions(roleId, permissionKeys);

    if (result.error) {
      return { error: result.error };
    }

    await reload();
    return { error: null };
  }

  return { rows, permissions, mode, loading, error, addRole, saveRolePermissions };
}
