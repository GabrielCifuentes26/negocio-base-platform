import { format } from "date-fns";

import { businessConfig } from "@/config/business";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat(businessConfig.locale, {
    style: "currency",
    currency: businessConfig.currency.code,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value: string | Date, pattern = "dd/MM/yyyy") {
  return format(new Date(value), pattern);
}

export function formatTime(value: string | Date) {
  return new Intl.DateTimeFormat(businessConfig.locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function humanizeStatus(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatWeekdayShort(value: string | Date) {
  return new Intl.DateTimeFormat(businessConfig.locale, {
    weekday: "short",
  }).format(new Date(value));
}
