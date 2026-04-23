import type { PermissionKey } from "@/types/auth";

export type PermissionListItem = {
  id: string;
  key: PermissionKey;
  moduleKey: string;
  action: string;
  description: string | null;
};

export type RoleListItem = {
  id: string;
  key: string;
  name: string;
  scope: string;
  users: number;
  permissionsCount: number;
  permissionKeys: PermissionKey[];
  isSystem: boolean;
  source: "demo" | "supabase";
};

export type CreateRoleInput = {
  name: string;
  key: string;
  description?: string;
  permissionKeys: PermissionKey[];
};
