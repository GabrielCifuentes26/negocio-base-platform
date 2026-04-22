const ACTIVE_BUSINESS_STORAGE_KEY = "negocio-base.active-business-id";

export function readPreferredBusinessId() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACTIVE_BUSINESS_STORAGE_KEY);
}

export function persistPreferredBusinessId(businessId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACTIVE_BUSINESS_STORAGE_KEY, businessId);
}

export function clearPreferredBusinessId() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ACTIVE_BUSINESS_STORAGE_KEY);
}
