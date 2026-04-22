export type UserRoleKey = "owner" | "admin" | "manager" | "staff";
export type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "demo";

export type PermissionKey =
  | "manage_all"
  | "view_reports"
  | "manage_branding"
  | "manage_settings"
  | "manage_users"
  | "manage_roles";

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
