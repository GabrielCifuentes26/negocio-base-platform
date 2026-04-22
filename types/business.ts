export type BusinessHours = {
  day: string;
  opensAt: string;
  closesAt: string;
  enabled: boolean;
};

export type BrandingConfig = {
  logoText: string;
  colors: {
    primary: string;
    primaryForeground: string;
    accent: string;
    accentForeground: string;
    sidebar: string;
  };
  fontFamily: string;
  images: {
    hero: string;
    logo: string;
  };
};

export type BusinessConfig = {
  id: string;
  name: string;
  locale: string;
  currency: {
    code: string;
    symbol: string;
  };
  branding: BrandingConfig;
  contact: {
    email: string;
    phone: string;
    address: string;
    website: string;
  };
  modules: string[];
  texts: {
    welcomeMessage: string;
    dashboardHeadline: string;
  };
  hours: BusinessHours[];
};
