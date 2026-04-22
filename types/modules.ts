export type ModuleKey =
  | "dashboard"
  | "customers"
  | "services"
  | "products"
  | "appointments"
  | "sales"
  | "users"
  | "roles"
  | "settings"
  | "branding"
  | "reports";

export type PlatformModule = {
  key: ModuleKey;
  label: string;
  description: string;
  href: string;
  enabledByDefault: boolean;
};
