import type { PermissionKey, UserRoleKey } from "@/types/auth";
import type { ModuleKey } from "@/types/modules";

export type PermissionDefinition = {
  key: PermissionKey;
  moduleKey: ModuleKey | "core";
  action: "all" | "read" | "create" | "update" | "delete" | "manage";
  description: string;
  legacy?: boolean;
};

const legacyPermissionDefinitions: PermissionDefinition[] = [
  { key: "manage_all", moduleKey: "core", action: "all", description: "Acceso total" },
  { key: "view_reports", moduleKey: "reports", action: "read", description: "Ver reportes", legacy: true },
  {
    key: "manage_branding",
    moduleKey: "branding",
    action: "manage",
    description: "Administrar branding",
    legacy: true,
  },
  {
    key: "manage_settings",
    moduleKey: "settings",
    action: "manage",
    description: "Administrar configuracion",
    legacy: true,
  },
  {
    key: "manage_users",
    moduleKey: "users",
    action: "manage",
    description: "Administrar usuarios",
    legacy: true,
  },
  {
    key: "manage_roles",
    moduleKey: "roles",
    action: "manage",
    description: "Administrar roles",
    legacy: true,
  },
];

const actionPermissionDefinitions: PermissionDefinition[] = [
  { key: "dashboard.read", moduleKey: "dashboard", action: "read", description: "Ver dashboard" },
  { key: "customers.read", moduleKey: "customers", action: "read", description: "Ver clientes" },
  { key: "customers.create", moduleKey: "customers", action: "create", description: "Crear clientes" },
  { key: "customers.update", moduleKey: "customers", action: "update", description: "Editar clientes" },
  { key: "customers.delete", moduleKey: "customers", action: "delete", description: "Eliminar clientes" },
  { key: "services.read", moduleKey: "services", action: "read", description: "Ver servicios" },
  { key: "services.create", moduleKey: "services", action: "create", description: "Crear servicios" },
  { key: "services.update", moduleKey: "services", action: "update", description: "Editar servicios" },
  { key: "services.delete", moduleKey: "services", action: "delete", description: "Eliminar servicios" },
  { key: "products.read", moduleKey: "products", action: "read", description: "Ver productos" },
  { key: "products.create", moduleKey: "products", action: "create", description: "Crear productos" },
  { key: "products.update", moduleKey: "products", action: "update", description: "Editar productos" },
  { key: "products.delete", moduleKey: "products", action: "delete", description: "Eliminar productos" },
  { key: "appointments.read", moduleKey: "appointments", action: "read", description: "Ver citas y reservas" },
  { key: "appointments.create", moduleKey: "appointments", action: "create", description: "Crear citas y reservas" },
  { key: "appointments.update", moduleKey: "appointments", action: "update", description: "Editar citas y reservas" },
  { key: "appointments.delete", moduleKey: "appointments", action: "delete", description: "Eliminar citas y reservas" },
  { key: "sales.read", moduleKey: "sales", action: "read", description: "Ver ventas" },
  { key: "sales.create", moduleKey: "sales", action: "create", description: "Registrar ventas" },
  { key: "sales.update", moduleKey: "sales", action: "update", description: "Editar ventas" },
  { key: "sales.delete", moduleKey: "sales", action: "delete", description: "Eliminar ventas" },
  { key: "users.read", moduleKey: "users", action: "read", description: "Ver usuarios y empleados" },
  { key: "users.manage", moduleKey: "users", action: "manage", description: "Administrar usuarios, membresias e invitaciones" },
  { key: "roles.read", moduleKey: "roles", action: "read", description: "Ver roles y permisos" },
  { key: "roles.manage", moduleKey: "roles", action: "manage", description: "Administrar roles y permisos" },
  { key: "settings.read", moduleKey: "settings", action: "read", description: "Ver configuracion del negocio" },
  { key: "settings.update", moduleKey: "settings", action: "update", description: "Editar configuracion del negocio" },
  { key: "branding.read", moduleKey: "branding", action: "read", description: "Ver branding y tema" },
  { key: "branding.update", moduleKey: "branding", action: "update", description: "Editar branding y assets" },
  { key: "reports.read", moduleKey: "reports", action: "read", description: "Ver reportes" },
];

export const permissionCatalog: PermissionDefinition[] = [
  ...legacyPermissionDefinitions,
  ...actionPermissionDefinitions,
];

export const visiblePermissionCatalog = permissionCatalog.filter((permission) => !permission.legacy);
export const visiblePermissionKeys = visiblePermissionCatalog.map((permission) => permission.key);

export const legacyPermissionKeys = legacyPermissionDefinitions.map((permission) => permission.key);

export const permissionAliasMap: Partial<Record<PermissionKey, PermissionKey[]>> = {
  "reports.read": ["view_reports"],
  "branding.read": ["manage_branding"],
  "branding.update": ["manage_branding"],
  "settings.read": ["manage_settings"],
  "settings.update": ["manage_settings"],
  "users.read": ["manage_users"],
  "users.manage": ["manage_users"],
  "roles.read": ["manage_roles"],
  "roles.manage": ["manage_roles"],
  view_reports: ["reports.read"],
  manage_branding: ["branding.read", "branding.update"],
  manage_settings: ["settings.read", "settings.update"],
  manage_users: ["users.read", "users.manage"],
  manage_roles: ["roles.read", "roles.manage"],
};

export const moduleAccessRequirements: Partial<Record<ModuleKey, PermissionKey[]>> = {
  dashboard: ["dashboard.read"],
  customers: ["customers.read"],
  services: ["services.read"],
  products: ["products.read"],
  appointments: ["appointments.read"],
  sales: ["sales.read"],
  reports: ["reports.read", "view_reports"],
  branding: ["branding.read", "branding.update", "manage_branding"],
  settings: ["settings.read", "settings.update", "manage_settings"],
  users: ["users.read", "users.manage", "manage_users"],
  roles: ["roles.read", "roles.manage", "manage_roles"],
};

const permissionDependencyMap: Partial<Record<PermissionKey, PermissionKey[]>> = {
  "customers.create": ["customers.read"],
  "customers.update": ["customers.read"],
  "customers.delete": ["customers.read"],
  "services.create": ["services.read"],
  "services.update": ["services.read"],
  "services.delete": ["services.read"],
  "products.create": ["products.read"],
  "products.update": ["products.read"],
  "products.delete": ["products.read"],
  "appointments.create": ["appointments.read"],
  "appointments.update": ["appointments.read"],
  "appointments.delete": ["appointments.read"],
  "sales.create": ["sales.read"],
  "sales.update": ["sales.read"],
  "sales.delete": ["sales.read"],
  "users.manage": ["users.read"],
  "roles.manage": ["roles.read"],
  "settings.update": ["settings.read"],
  "branding.update": ["branding.read"],
  manage_users: ["users.read"],
  manage_roles: ["roles.read"],
  manage_settings: ["settings.read"],
  manage_branding: ["branding.read"],
  view_reports: ["reports.read"],
};

export function normalizePermissionKeys(permissionKeys: PermissionKey[]) {
  const normalized = new Set(permissionKeys);
  let changed = true;

  while (changed) {
    changed = false;

    for (const permissionKey of [...normalized]) {
      for (const dependency of permissionDependencyMap[permissionKey] ?? []) {
        if (normalized.has(dependency)) {
          continue;
        }

        normalized.add(dependency);
        changed = true;
      }
    }
  }

  const orderedPermissions = permissionCatalog
    .map((permission) => permission.key)
    .filter((permission) => normalized.has(permission));

  const remainingPermissions = [...normalized].filter((permission) => !orderedPermissions.includes(permission));

  return [...orderedPermissions, ...remainingPermissions];
}

export const defaultRolePermissionMatrix: Record<UserRoleKey, PermissionKey[]> = {
  owner: ["manage_all", ...visiblePermissionKeys.filter((permission) => permission !== "manage_all")],
  admin: [
    "dashboard.read",
    "customers.read",
    "customers.create",
    "customers.update",
    "customers.delete",
    "services.read",
    "services.create",
    "services.update",
    "services.delete",
    "products.read",
    "products.create",
    "products.update",
    "products.delete",
    "appointments.read",
    "appointments.create",
    "appointments.update",
    "appointments.delete",
    "sales.read",
    "sales.create",
    "sales.update",
    "sales.delete",
    "users.read",
    "users.manage",
    "roles.read",
    "roles.manage",
    "settings.read",
    "settings.update",
    "branding.read",
    "branding.update",
    "reports.read",
  ],
  manager: [
    "dashboard.read",
    "customers.read",
    "customers.create",
    "customers.update",
    "services.read",
    "services.create",
    "services.update",
    "products.read",
    "products.create",
    "products.update",
    "appointments.read",
    "appointments.create",
    "appointments.update",
    "sales.read",
    "sales.create",
    "sales.update",
    "users.read",
    "reports.read",
  ],
  staff: [
    "dashboard.read",
    "customers.read",
    "customers.create",
    "customers.update",
    "services.read",
    "products.read",
    "appointments.read",
    "appointments.create",
    "appointments.update",
    "sales.read",
    "sales.create",
  ],
};

export function isLegacyPermissionKey(value: string): value is PermissionKey {
  return legacyPermissionKeys.includes(value as PermissionKey);
}
