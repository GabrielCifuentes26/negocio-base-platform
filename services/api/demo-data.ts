import { getPermissionsByRole } from "@/lib/permissions/ability";
import { visiblePermissionCatalog } from "@/lib/permissions/catalog";
import type { UserRoleKey } from "@/types/auth";

export const demoCustomers = [
  { id: "cus_01", name: "Ana Lopez", phone: "+502 4111-2233", visits: 8, lastVisit: "2026-04-19" },
  { id: "cus_02", name: "Carlos Mendez", phone: "+502 4222-3344", visits: 5, lastVisit: "2026-04-21" },
  { id: "cus_03", name: "Maria Ruiz", phone: "+502 4333-4455", visits: 12, lastVisit: "2026-04-20" },
];

export const demoServices = [
  { id: "srv_01", name: "Corte premium", price: 120, duration: "45 min", status: "Activo" },
  { id: "srv_02", name: "Color express", price: 260, duration: "90 min", status: "Activo" },
  { id: "srv_03", name: "Consulta inicial", price: 180, duration: "30 min", status: "Activo" },
];

export const demoProducts = [
  { id: "prd_01", name: "Shampoo profesional", sku: "SH-001", stock: 24, price: 95 },
  { id: "prd_02", name: "Libro edicion especial", sku: "LB-220", stock: 8, price: 185 },
  { id: "prd_03", name: "Crema reparadora", sku: "CR-102", stock: 13, price: 110 },
];

export const demoAppointments = [
  { id: "app_01", customer: "Ana Lopez", service: "Corte premium", employee: "Luis", time: "09:00", status: "Confirmada" },
  { id: "app_02", customer: "Carlos Mendez", service: "Consulta inicial", employee: "Sofia", time: "11:30", status: "Pendiente" },
  { id: "app_03", customer: "Maria Ruiz", service: "Color express", employee: "Paula", time: "15:00", status: "En curso" },
];

export const demoSales = [
  { id: "sale_01", ticket: "TK-1021", customer: "Ana Lopez", total: 215, status: "Pagado" },
  { id: "sale_02", ticket: "TK-1022", customer: "Carlos Mendez", total: 120, status: "Pagado" },
  { id: "sale_03", ticket: "TK-1023", customer: "Mostrador", total: 95, status: "Pendiente" },
];

export const demoUsers = [
  { id: "usr_01", name: "Luis Herrera", role: "manager", email: "luis@negocio.com", status: "Activo" },
  { id: "usr_02", name: "Paula Diaz", role: "staff", email: "paula@negocio.com", status: "Activo" },
  { id: "usr_03", name: "Sofia Garcia", role: "staff", email: "sofia@negocio.com", status: "Activo" },
];

const demoRoleDefinitions: Array<{
  id: string;
  key: UserRoleKey;
  name: string;
  scope: string;
  users: number;
}> = [
  {
    id: "role_owner",
    key: "owner",
    name: "Owner",
    scope: "Acceso total",
    users: 1,
  },
  {
    id: "role_admin",
    key: "admin",
    name: "Admin",
    scope: "Operacion y configuracion",
    users: 1,
  },
  {
    id: "role_manager",
    key: "manager",
    name: "Manager",
    scope: "Operacion diaria y reportes",
    users: 2,
  },
  {
    id: "role_staff",
    key: "staff",
    name: "Staff",
    scope: "Agenda y atencion",
    users: 6,
  },
];

export const demoRoles = [
  ...demoRoleDefinitions.map((role) => {
    const permissionKeys = getPermissionsByRole(role.key);

    return {
      id: role.id,
      key: role.key,
      name: role.name,
      scope: role.scope,
      users: role.users,
      permissionsCount: permissionKeys.length,
      permissionKeys,
    };
  }),
];

export const demoPermissions = visiblePermissionCatalog.map((permission, index) => ({
  id: `perm_${String(index + 1).padStart(2, "0")}`,
  key: permission.key,
  moduleKey: permission.moduleKey,
  action: permission.action,
  description: permission.description,
}));

export const demoMetrics = {
  revenue: 18750,
  appointmentsToday: 28,
  activeCustomers: 132,
  conversionRate: 68,
};

export const revenueTrend = [
  { name: "Lun", revenue: 2100 },
  { name: "Mar", revenue: 2800 },
  { name: "Mie", revenue: 2400 },
  { name: "Jue", revenue: 3200 },
  { name: "Vie", revenue: 4100 },
  { name: "Sab", revenue: 4150 },
];
