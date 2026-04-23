export type UserRoleKey = "owner" | "admin" | "manager" | "staff";
export type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "demo";

export type PermissionKey =
  | "manage_all"
  | "view_reports"
  | "manage_branding"
  | "manage_settings"
  | "manage_users"
  | "manage_roles"
  | "dashboard.read"
  | "customers.read"
  | "customers.create"
  | "customers.update"
  | "customers.delete"
  | "services.read"
  | "services.create"
  | "services.update"
  | "services.delete"
  | "products.read"
  | "products.create"
  | "products.update"
  | "products.delete"
  | "appointments.read"
  | "appointments.create"
  | "appointments.update"
  | "appointments.delete"
  | "sales.read"
  | "sales.create"
  | "sales.update"
  | "sales.delete"
  | "users.read"
  | "users.manage"
  | "roles.read"
  | "roles.manage"
  | "settings.read"
  | "settings.update"
  | "branding.read"
  | "branding.update"
  | "reports.read";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRoleKey;
};

export type SignInCredentials = {
  email: string;
  password: string;
};

export type AuthSession = {
  user: AuthUser;
  businessId: string;
};
