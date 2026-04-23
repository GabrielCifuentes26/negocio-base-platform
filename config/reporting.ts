import type { ReportRangeKey } from "@/types/report";

export type ReportRangePreset = {
  key: ReportRangeKey;
  label: string;
  days: number;
  description: string;
};

export const reportRangePresets: ReportRangePreset[] = [
  {
    key: "7d",
    label: "7 dias",
    days: 7,
    description: "Lectura reciente para seguimiento semanal.",
  },
  {
    key: "30d",
    label: "30 dias",
    days: 30,
    description: "Vista comercial del ultimo mes.",
  },
  {
    key: "90d",
    label: "90 dias",
    days: 90,
    description: "Pulso mas amplio para evaluar tendencia.",
  },
];

export function getReportRangePreset(rangeKey: ReportRangeKey) {
  return reportRangePresets.find((preset) => preset.key === rangeKey) ?? reportRangePresets[0];
}
