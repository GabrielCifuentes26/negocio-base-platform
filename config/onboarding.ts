import type { BusinessTemplate, OnboardingOption } from "@/types/onboarding";

export const businessTemplates: BusinessTemplate[] = [
  {
    key: "barbershop",
    label: "Barberia",
    description: "Agenda rapida, clientes frecuentes y venta ligera en mostrador.",
    recommendedModules: ["dashboard", "customers", "services", "products", "appointments", "sales", "users", "roles", "settings", "branding", "reports"],
    defaultWelcomeMessage: "Bienvenido a tu espacio de trabajo. Hoy puedes gestionar agenda, clientes y ventas desde una sola base.",
    branding: {
      primaryColor: "#14532d",
      accentColor: "#fde68a",
      fontFamily: "Manrope",
    },
  },
  {
    key: "salon",
    label: "Salon",
    description: "Servicios combinados, equipo amplio y marca visual mas expresiva.",
    recommendedModules: ["dashboard", "customers", "services", "products", "appointments", "sales", "users", "roles", "settings", "branding", "reports"],
    defaultWelcomeMessage: "Tu operacion ya tiene una base lista para servicios, equipo y experiencia de marca.",
    branding: {
      primaryColor: "#be185d",
      accentColor: "#fbcfe8",
      fontFamily: "Manrope",
    },
  },
  {
    key: "clinic",
    label: "Clinica",
    description: "Reservas ordenadas, clientes recurrentes y control operativo claro.",
    recommendedModules: ["dashboard", "customers", "services", "appointments", "sales", "users", "roles", "settings", "branding", "reports"],
    defaultWelcomeMessage: "Tu negocio ya puede centralizar atencion, personal y seguimiento desde una sola plataforma.",
    branding: {
      primaryColor: "#0f766e",
      accentColor: "#ccfbf1",
      fontFamily: "Manrope",
    },
  },
  {
    key: "bookstore",
    label: "Libreria",
    description: "Catalogo de productos, ventas de mostrador y clientes habituales.",
    recommendedModules: ["dashboard", "customers", "products", "sales", "users", "roles", "settings", "branding", "reports"],
    defaultWelcomeMessage: "Tu catalogo, ventas y configuracion del negocio quedan centralizados desde el primer dia.",
    branding: {
      primaryColor: "#7c2d12",
      accentColor: "#fed7aa",
      fontFamily: "Manrope",
    },
  },
];

export const onboardingLocales: OnboardingOption[] = [
  { value: "es-GT", label: "Espanol (Guatemala)" },
  { value: "es-MX", label: "Espanol (Mexico)" },
  { value: "es-ES", label: "Espanol (Espana)" },
  { value: "en-US", label: "English (United States)" },
];

export const onboardingCurrencies: OnboardingOption[] = [
  { value: "GTQ", label: "GTQ - Quetzal" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "MXN", label: "MXN - Peso mexicano" },
  { value: "EUR", label: "EUR - Euro" },
];

export const onboardingTimezones: OnboardingOption[] = [
  { value: "America/Guatemala", label: "America/Guatemala" },
  { value: "America/Mexico_City", label: "America/Mexico_City" },
  { value: "America/Bogota", label: "America/Bogota" },
  { value: "America/New_York", label: "America/New_York" },
];
