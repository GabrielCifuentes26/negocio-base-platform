import type { AuthSession } from "@/types/auth";

export const demoSession: AuthSession = {
  user: {
    id: "usr_demo_owner",
    email: "owner@negocio.com",
    fullName: "Administrador Demo",
    role: "owner",
  },
  businessId: "biz_demo",
};
