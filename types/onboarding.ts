export type BusinessTemplateKey = "barbershop" | "salon" | "clinic" | "bookstore";

export type BusinessTemplate = {
  key: BusinessTemplateKey;
  label: string;
  description: string;
  recommendedModules: string[];
  defaultWelcomeMessage: string;
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
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
};
