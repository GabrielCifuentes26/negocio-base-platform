import type { BusinessConfig } from "@/types/business";

export const businessConfig: BusinessConfig = {
  id: "biz_demo",
  name: "Negocio Base",
  locale: "es-GT",
  currency: {
    code: "GTQ",
    symbol: "Q",
  },
  branding: {
    logoText: "NB",
    colors: {
      primary: "#0f766e",
      primaryForeground: "#f8fffd",
      accent: "#fef3c7",
      accentForeground: "#92400e",
      sidebar: "#fffdf7",
    },
    fontFamily: "Manrope",
    images: {
      hero: "/brand/hero-grid.svg",
      logo: "/brand/logo-mark.svg",
    },
  },
  contact: {
    email: "hola@negociobase.com",
    phone: "+502 5555-0101",
    address: "Ciudad de Guatemala, Guatemala",
    website: "https://negociobase.local",
  },
  modules: [
    "dashboard",
    "customers",
    "services",
    "products",
    "appointments",
    "sales",
    "users",
    "roles",
    "settings",
    "branding",
    "reports",
  ],
  texts: {
    welcomeMessage: "Bienvenido al sistema base reusable para operación diaria.",
    dashboardHeadline: "Controla la operación, personaliza la marca y escala sin rehacer.",
  },
  hours: [
    { day: "Lunes", opensAt: "08:00", closesAt: "18:00", enabled: true },
    { day: "Martes", opensAt: "08:00", closesAt: "18:00", enabled: true },
    { day: "Miércoles", opensAt: "08:00", closesAt: "18:00", enabled: true },
    { day: "Jueves", opensAt: "08:00", closesAt: "18:00", enabled: true },
    { day: "Viernes", opensAt: "08:00", closesAt: "19:00", enabled: true },
    { day: "Sábado", opensAt: "09:00", closesAt: "15:00", enabled: true },
    { day: "Domingo", opensAt: "00:00", closesAt: "00:00", enabled: false },
  ],
};
