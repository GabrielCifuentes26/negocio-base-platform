export type PermissionListItem = {
  id: string;
  key: string;
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
  permissionKeys: string[];
  isSystem: boolean;
  source: "demo" | "supabase";
};

export type CreateRoleInput = {
  name: string;
  key: string;
  description?: string;
  permissionKeys: string[];
};
