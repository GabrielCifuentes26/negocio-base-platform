import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  demoAppointments,
  demoCustomers,
  demoProducts,
  demoRoles,
  demoSales,
  demoServices,
  demoUsers,
} from "@/services/api/demo-data";

export async function getModuleData(moduleKey: string) {
  if (isSupabaseConfigured()) {
    return { mode: "supabase", rows: [] };
  }

  const map = {
    customers: demoCustomers,
    services: demoServices,
    products: demoProducts,
    appointments: demoAppointments,
    sales: demoSales,
    users: demoUsers,
    roles: demoRoles,
  };

  return {
    mode: "demo",
    rows: map[moduleKey as keyof typeof map] ?? [],
  };
}
