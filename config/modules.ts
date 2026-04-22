import {
  BarChart3,
  BrushCleaning,
  CalendarRange,
  ContactRound,
  LayoutDashboard,
  Package,
  ReceiptText,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { canAccessModuleByPermission } from "@/lib/permissions/ability";
import type { PermissionKey } from "@/types/auth";
import type { NavigationItem } from "@/types/navigation";
import type { ModuleKey, PlatformModule } from "@/types/modules";

export const platformModules: PlatformModule[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    description: "Vision ejecutiva y operativa de la jornada.",
    href: "/dashboard",
    enabledByDefault: true,
  },
  {
    key: "customers",
    label: "Clientes",
    description: "Base reusable de clientes y seguimiento.",
    href: "/customers",
    enabledByDefault: true,
  },
  {
    key: "services",
    label: "Servicios",
    description: "Catalogo configurable para negocios de servicio.",
    href: "/services",
    enabledByDefault: true,
  },
  {
    key: "products",
    label: "Productos",
    description: "Inventario ligero y venta asociada.",
    href: "/products",
    enabledByDefault: true,
  },
  {
    key: "appointments",
    label: "Reservas",
    description: "Agenda, estados y asignacion de personal.",
    href: "/appointments",
    enabledByDefault: true,
  },
  {
    key: "sales",
    label: "Ventas",
    description: "Cobros basicos y tickets listos para crecer.",
    href: "/sales",
    enabledByDefault: true,
  },
  {
    key: "users",
    label: "Usuarios",
    description: "Gestion de empleados y accesos.",
    href: "/users",
    enabledByDefault: true,
  },
  {
    key: "roles",
    label: "Roles",
    description: "Permisos y estructura de seguridad.",
    href: "/roles",
    enabledByDefault: true,
  },
  {
    key: "settings",
    label: "Negocio",
    description: "Configuracion operativa y comercial.",
    href: "/settings",
    enabledByDefault: true,
  },
  {
    key: "branding",
    label: "Branding",
    description: "Tema, identidad y assets visuales.",
    href: "/branding",
    enabledByDefault: true,
  },
  {
    key: "reports",
    label: "Reportes",
    description: "Indicadores base y analisis inicial.",
    href: "/reports",
    enabledByDefault: true,
  },
];

const navigationIconMap: Record<ModuleKey, NavigationItem["icon"]> = {
  dashboard: LayoutDashboard,
  customers: ContactRound,
  services: BrushCleaning,
  products: Package,
  appointments: CalendarRange,
  sales: ReceiptText,
  users: Users,
  roles: ShieldCheck,
  settings: Settings2,
  branding: Sparkles,
  reports: BarChart3,
};

const navigationDescriptionMap: Record<ModuleKey, string> = {
  dashboard: "Resumen general",
  customers: "CRM ligero",
  services: "Catalogo operativo",
  products: "Retail e inventario",
  appointments: "Agenda diaria",
  sales: "Tickets y cobros",
  users: "Equipo",
  roles: "Permisos",
  settings: "Datos generales",
  branding: "Tema visual",
  reports: "KPIs",
};

export const platformNavigation: NavigationItem[] = platformModules.map((module) => ({
  label: module.label,
  description: navigationDescriptionMap[module.key],
  href: module.href,
  icon: navigationIconMap[module.key],
}));

const hrefToModuleKey = new Map(platformModules.map((module) => [module.href, module.key]));

export function getModuleKeyFromHref(href: string) {
  return hrefToModuleKey.get(href) ?? null;
}

export function getNavigationItems(moduleKeys?: string[], permissions?: PermissionKey[]) {
  if (!moduleKeys || moduleKeys.length === 0) {
    return permissions && permissions.length > 0
      ? platformNavigation.filter((item) => {
          const key = getModuleKeyFromHref(item.href);
          return key ? canAccessModuleByPermission(key, permissions) : true;
        })
      : platformNavigation;
  }

  const enabled = new Set(moduleKeys);
  return platformNavigation.filter((item) => {
    const key = getModuleKeyFromHref(item.href);
    if (!key) {
      return false;
    }

    const moduleEnabled = enabled.has(key);
    const permissionEnabled = permissions ? canAccessModuleByPermission(key, permissions) : true;

    return moduleEnabled && permissionEnabled;
  });
}

export function getDefaultModuleHref(moduleKeys?: string[], permissions?: PermissionKey[]) {
  const navigation = getNavigationItems(moduleKeys, permissions);
  return navigation[0]?.href ?? "/dashboard";
}
