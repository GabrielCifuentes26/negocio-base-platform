import type { PermissionKey, UserRoleKey } from "@/types/auth";
import type { ModuleKey } from "@/types/modules";

const roleMatrix: Record<UserRoleKey, PermissionKey[]> = {
  owner: [
    "manage_all",
    "view_reports",
    "manage_branding",
    "manage_settings",
    "manage_users",
    "manage_roles",
  ],
  admin: [
    "view_reports",
    "manage_branding",
    "manage_settings",
    "manage_users",
    "manage_roles",
  ],
  manager: ["view_reports"],
  staff: [],
};

const modulePermissionMap: Partial<Record<ModuleKey, PermissionKey>> = {
  reports: "view_reports",
  branding: "manage_branding",
  settings: "manage_settings",
  users: "manage_users",
  roles: "manage_roles",
};

export function getPermissionsByRole(role: UserRoleKey): PermissionKey[] {
  return roleMatrix[role];
}

export function hasPermission(role: UserRoleKey, permission: PermissionKey) {
  return roleMatrix[role].includes("manage_all") || roleMatrix[role].includes(permission);
}

export function hasPermissionInSet(permissions: PermissionKey[], permission: PermissionKey) {
  return permissions.includes("manage_all") || permissions.includes(permission);
}

export function canAccessModuleByPermission(moduleKey: ModuleKey, permissions: PermissionKey[]) {
  const requiredPermission = modulePermissionMap[moduleKey];
  return requiredPermission ? hasPermissionInSet(permissions, requiredPermission) : true;
}
