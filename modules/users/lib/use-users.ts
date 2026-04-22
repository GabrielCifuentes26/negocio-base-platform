"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { listRoles } from "@/services/api/role-service";
import { listWorkspaceUsers, updateWorkspaceMemberRole } from "@/services/api/team-service";
import type { RoleListItem } from "@/types/role";
import type { TeamMemberListItem } from "@/types/team";

export function useUsers() {
  const { workspace, supabaseEnabled, status, refreshWorkspace } = useAuth();
  const [rows, setRows] = useState<TeamMemberListItem[]>([]);
  const [roles, setRoles] = useState<RoleListItem[]>([]);
  const [mode, setMode] = useState<"demo" | "supabase">(supabaseEnabled ? "supabase" : "demo");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setLoading(true);
    const [usersResult, rolesResult] = await Promise.all([
      listWorkspaceUsers(workspace?.businessId),
      listRoles(workspace?.businessId),
    ]);

    setRows(usersResult.rows);
    setRoles(rolesResult.rows);
    setMode(usersResult.mode);
    setError(usersResult.error ?? rolesResult.error);
    setLoading(false);
  }

  useEffect(() => {
    if (supabaseEnabled && status === "loading") {
      return;
    }

    let isActive = true;

    void Promise.all([listWorkspaceUsers(workspace?.businessId), listRoles(workspace?.businessId)]).then(
      ([usersResult, rolesResult]) => {
        if (!isActive) {
          return;
        }

        setRows(usersResult.rows);
        setRoles(rolesResult.rows);
        setMode(usersResult.mode);
        setError(usersResult.error ?? rolesResult.error);
        setLoading(false);
      },
    );

    return () => {
      isActive = false;
    };
  }, [status, supabaseEnabled, workspace?.businessId]);

  async function changeRole(membershipId: string, roleId: string) {
    const result = await updateWorkspaceMemberRole(membershipId, roleId);

    if (result.error) {
      return { error: result.error };
    }

    await Promise.all([reload(), refreshWorkspace()]);
    return { error: null };
  }

  return { rows, roles, mode, loading, error, changeRole };
}
