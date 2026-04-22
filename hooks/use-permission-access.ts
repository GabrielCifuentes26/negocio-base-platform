"use client";

import type { PermissionKey } from "@/types/auth";
import type { ModuleKey } from "@/types/modules";

import { canAccessModuleByPermission, hasPermissionInSet } from "@/lib/permissions/ability";
import { useAuth } from "@/hooks/use-auth";

export function usePermissionAccess() {
  const { workspace } = useAuth();
  const permissions = workspace?.permissions ?? [];

  return {
    permissions,
    can: (permission: PermissionKey) => hasPermissionInSet(permissions, permission),
    canAccessModule: (moduleKey: ModuleKey) => canAccessModuleByPermission(moduleKey, permissions),
  };
}
