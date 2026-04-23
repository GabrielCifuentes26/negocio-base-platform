import type { PermissionKey, UserRoleKey } from "@/types/auth";
import type { ModuleKey } from "@/types/modules";

import {
  defaultRolePermissionMatrix,
  moduleAccessRequirements,
  permissionAliasMap,
} from "@/lib/permissions/catalog";

function getEquivalentPermissions(permission: PermissionKey) {
  const directAliases = permissionAliasMap[permission] ?? [];
  const reverseAliases = Object.entries(permissionAliasMap)
    .filter(([, aliases]) => aliases?.includes(permission))
    .map(([key]) => key as PermissionKey);

  return [permission, ...directAliases, ...reverseAliases];
}

export function getPermissionsByRole(role: UserRoleKey): PermissionKey[] {
  return defaultRolePermissionMatrix[role];
}

export function hasPermission(role: UserRoleKey, permission: PermissionKey) {
  return hasPermissionInSet(defaultRolePermissionMatrix[role], permission);
}

export function hasPermissionInSet(permissions: PermissionKey[], permission: PermissionKey) {
  if (permissions.includes("manage_all")) {
    return true;
  }

  return getEquivalentPermissions(permission).some((candidate) => permissions.includes(candidate));
}

export function canAccessModuleByPermission(moduleKey: ModuleKey, permissions: PermissionKey[]) {
  const requiredPermissions = moduleAccessRequirements[moduleKey];
  return requiredPermissions ? requiredPermissions.some((permission) => hasPermissionInSet(permissions, permission)) : true;
}
