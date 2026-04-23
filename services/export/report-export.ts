import { stringifyCsv } from "@/lib/export/csv";
import type { DashboardSnapshot } from "@/types/dashboard";
import type { ReportSnapshot } from "@/types/report";

type ExportRow = {
  section: string;
  label: string;
  value: string | number;
  detail: string;
  extra: string;
  date: string;
};

function slugifyFileName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildDashboardSnapshotCsv(snapshot: DashboardSnapshot, businessName: string) {
  const generatedAt = new Date().toISOString();
  const rows: ExportRow[] = [
    { section: "meta", label: "business", value: businessName, detail: "", extra: snapshot.mode, date: generatedAt },
    { section: "metric", label: "revenue", value: snapshot.metrics.revenue, detail: "", extra: "", date: generatedAt },
    {
      section: "metric",
      label: "appointments_today",
      value: snapshot.metrics.appointmentsToday,
      detail: "",
      extra: "",
      date: generatedAt,
    },
    {
      section: "metric",
      label: "active_customers",
      value: snapshot.metrics.activeCustomers,
      detail: "",
      extra: "",
      date: generatedAt,
    },
    {
      section: "metric",
      label: "conversion_rate",
      value: snapshot.metrics.conversionRate,
      detail: "",
      extra: "",
      date: generatedAt,
    },
    ...snapshot.trend.map((item) => ({
      section: "trend",
      label: item.name,
      value: item.revenue,
      detail: "",
      extra: "",
      date: generatedAt,
    })),
    ...snapshot.appointments.map((item) => ({
      section: "appointment",
      label: item.customer,
      value: item.status,
      detail: `${item.service} / ${item.employee}`,
      extra: item.time,
      date: item.startsAt,
    })),
    ...snapshot.sales.map((item) => ({
      section: "sale",
      label: item.ticket,
      value: item.total,
      detail: item.customer,
      extra: item.status,
      date: item.createdAt,
    })),
  ];

  return stringifyCsv(rows);
}

export function buildReportSnapshotCsv(snapshot: ReportSnapshot, businessName: string) {
  const generatedAt = new Date().toISOString();
  const rows: ExportRow[] = [
    {
      section: "meta",
      label: "business",
      value: businessName,
      detail: snapshot.rangeLabel,
      extra: snapshot.mode,
      date: generatedAt,
    },
    {
      section: "meta",
      label: "range_start",
      value: snapshot.rangeStart,
      detail: snapshot.rangeEnd,
      extra: snapshot.rangeKey,
      date: generatedAt,
    },
    { section: "metric", label: "revenue", value: snapshot.metrics.revenue, detail: "", extra: "", date: generatedAt },
    {
      section: "metric",
      label: "appointments_count",
      value: snapshot.metrics.appointmentsCount,
      detail: "",
      extra: "",
      date: generatedAt,
    },
    {
      section: "metric",
      label: "active_customers",
      value: snapshot.metrics.activeCustomers,
      detail: "",
      extra: "",
      date: generatedAt,
    },
    {
      section: "metric",
      label: "conversion_rate",
      value: snapshot.metrics.conversionRate,
      detail: "",
      extra: "",
      date: generatedAt,
    },
    ...snapshot.trend.map((item) => ({
      section: "trend",
      label: item.label,
      value: item.revenue,
      detail: item.date,
      extra: "",
      date: generatedAt,
    })),
    ...snapshot.appointments.map((item) => ({
      section: "appointment",
      label: item.customer,
      value: item.status,
      detail: `${item.service} / ${item.employee}`,
      extra: item.time,
      date: item.startsAt,
    })),
    ...snapshot.sales.map((item) => ({
      section: "sale",
      label: item.ticket,
      value: item.total,
      detail: item.customer,
      extra: item.status,
      date: item.createdAt,
    })),
  ];

  return stringifyCsv(rows);
}

export function downloadDashboardSnapshotCsv(snapshot: DashboardSnapshot, businessName: string) {
  if (typeof window === "undefined") {
    return false;
  }

  const csv = buildDashboardSnapshotCsv(snapshot, businessName);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  const timestamp = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `${slugifyFileName(businessName || "business")}-report-${timestamp}.csv`;
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
  window.URL.revokeObjectURL(url);

  return true;
}

export function downloadReportSnapshotCsv(snapshot: ReportSnapshot, businessName: string) {
  if (typeof window === "undefined") {
    return false;
  }

  const csv = buildReportSnapshotCsv(snapshot, businessName);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  const timestamp = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `${slugifyFileName(businessName || "business")}-report-${snapshot.rangeKey}-${timestamp}.csv`;
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
  window.URL.revokeObjectURL(url);

  return true;
}
