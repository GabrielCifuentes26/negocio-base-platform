import type { BusinessTemplate, OnboardingOption } from "@/types/onboarding";

const standardWeekHours = [
  { day: "monday", label: "Lunes", isOpen: true, opensAt: "09:00", closesAt: "19:00" },
  { day: "tuesday", label: "Martes", isOpen: true, opensAt: "09:00", closesAt: "19:00" },
  { day: "wednesday", label: "Miercoles", isOpen: true, opensAt: "09:00", closesAt: "19:00" },
  { day: "thursday", label: "Jueves", isOpen: true, opensAt: "09:00", closesAt: "19:00" },
  { day: "friday", label: "Viernes", isOpen: true, opensAt: "09:00", closesAt: "19:00" },
  { day: "saturday", label: "Sabado", isOpen: true, opensAt: "09:00", closesAt: "17:00" },
  { day: "sunday", label: "Domingo", isOpen: false, opensAt: "00:00", closesAt: "00:00" },
] as const;

export const businessTemplates: BusinessTemplate[] = [
  {
    key: "barbershop",
    label: "Barberia",
    description: "Agenda rapida, clientes frecuentes y venta ligera en mostrador.",
    recommendedModules: ["dashboard", "customers", "services", "products", "appointments", "sales", "users", "roles", "settings", "branding", "reports"],
    defaultWelcomeMessage: "Bienvenido a tu espacio de trabajo. Hoy puedes gestionar agenda, clientes y ventas desde una sola base.",
    defaultLocale: "es-GT",
    defaultCurrencyCode: "GTQ",
    defaultTimezone: "America/Guatemala",
    defaultHours: standardWeekHours.map((item) => ({ ...item })),
    suggestedServices: [
      { name: "Corte clasico", description: "Servicio base de barberia para clientes recurrentes.", durationMinutes: 45, price: 75 },
      { name: "Barba premium", description: "Perfilado, toalla caliente y acabado.", durationMinutes: 30, price: 55 },
      { name: "Corte + barba", description: "Paquete rapido para ticket medio mas alto.", durationMinutes: 60, price: 120 },
    ],
    suggestedProducts: [
      { name: "Pomada mate", description: "Producto de venta rapida en mostrador.", price: 95, stock: 12, sku: "BARB-POM-01" },
      { name: "Aceite para barba", description: "Complemento comun para clientes frecuentes.", price: 85, stock: 10, sku: "BARB-ACE-01" },
    ],
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
    defaultLocale: "es-GT",
    defaultCurrencyCode: "GTQ",
    defaultTimezone: "America/Guatemala",
    defaultHours: standardWeekHours.map((item) => ({
      ...item,
      closesAt: item.day === "saturday" ? "18:00" : item.closesAt,
    })),
    suggestedServices: [
      { name: "Corte de dama", description: "Servicio base con enfoque en experiencia y tiempo.", durationMinutes: 60, price: 140 },
      { name: "Coloracion express", description: "Servicio popular para agenda de media duracion.", durationMinutes: 90, price: 260 },
      { name: "Manicure spa", description: "Complemento de alto margen para fidelizacion.", durationMinutes: 45, price: 95 },
    ],
    suggestedProducts: [
      { name: "Shampoo profesional", description: "Producto sugerido para ticket complementario.", price: 110, stock: 15, sku: "SAL-SHA-01" },
      { name: "Mascarilla capilar", description: "Upsell comun en salones de belleza.", price: 135, stock: 8, sku: "SAL-MAS-01" },
    ],
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
    defaultLocale: "es-GT",
    defaultCurrencyCode: "GTQ",
    defaultTimezone: "America/Guatemala",
    defaultHours: standardWeekHours.map((item) => ({
      ...item,
      opensAt: item.isOpen ? "08:00" : item.opensAt,
      closesAt: item.day === "saturday" ? "13:00" : item.isOpen ? "17:00" : item.closesAt,
    })),
    suggestedServices: [
      { name: "Consulta inicial", description: "Espacio base para evaluacion o primera visita.", durationMinutes: 40, price: 250 },
      { name: "Control de seguimiento", description: "Cita recurrente para pacientes activos.", durationMinutes: 30, price: 180 },
      { name: "Procedimiento menor", description: "Bloque operativo para servicios clinicos breves.", durationMinutes: 60, price: 450 },
    ],
    suggestedProducts: [],
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
    defaultLocale: "es-GT",
    defaultCurrencyCode: "GTQ",
    defaultTimezone: "America/Guatemala",
    defaultHours: standardWeekHours.map((item) => ({
      ...item,
      opensAt: item.isOpen ? "10:00" : item.opensAt,
      closesAt: item.day === "saturday" ? "18:00" : item.isOpen ? "20:00" : item.closesAt,
    })),
    suggestedServices: [],
    suggestedProducts: [
      { name: "Novela destacada", description: "Producto ancla para ventas del primer catalogo.", price: 145, stock: 20, sku: "LIB-NOV-01" },
      { name: "Agenda anual", description: "Complemento de mostrador para ticket mixto.", price: 75, stock: 18, sku: "LIB-AGE-01" },
      { name: "Pack infantil", description: "Opcion comercial para fechas especiales.", price: 210, stock: 6, sku: "LIB-INF-01" },
    ],
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
