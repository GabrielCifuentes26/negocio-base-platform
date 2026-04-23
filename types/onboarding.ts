export type BusinessTemplateKey = "barbershop" | "salon" | "clinic" | "bookstore";

export type OnboardingHourPreset = {
  day: string;
  label: string;
  isOpen: boolean;
  opensAt: string;
  closesAt: string;
};

export type OnboardingServicePreset = {
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
};

export type OnboardingProductPreset = {
  name: string;
  description: string;
  price: number;
  stock: number;
  sku?: string;
};

export type BusinessTemplate = {
  key: BusinessTemplateKey;
  label: string;
  description: string;
  recommendedModules: string[];
  defaultWelcomeMessage: string;
  defaultLocale: string;
  defaultCurrencyCode: string;
  defaultTimezone: string;
  defaultHours: OnboardingHourPreset[];
  suggestedServices: OnboardingServicePreset[];
  suggestedProducts: OnboardingProductPreset[];
  branding: {
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
  };
};

export type OnboardingOption = {
  value: string;
  label: string;
};

export type BootstrapBusinessWorkspaceInput = {
  businessName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  welcomeMessage: string;
  locale: string;
  currencyCode: string;
  timezone: string;
  modules: string[];
  initialHours: OnboardingHourPreset[];
  seedServices: OnboardingServicePreset[];
  seedProducts: OnboardingProductPreset[];
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
};
