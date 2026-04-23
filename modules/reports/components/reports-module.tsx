"use client";

import { useState } from "react";
import { subDays } from "date-fns";
import { ArrowDownRight, ArrowUpRight, BarChart3, CalendarRange, Coins, Minus, Users } from "lucide-react";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { businessConfig } from "@/config/business";
import { customReportRangeOption, reportRangePresets } from "@/config/reporting";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
import { useReportSnapshot } from "@/modules/reports/lib/use-report-snapshot";
import { downloadReportSnapshotCsv } from "@/services/export/report-export";
import { ModuleCard } from "@/components/shared/module-card";
import { PageShell } from "@/components/shared/page-shell";
import { EmptyState } from "@/components/states/empty-state";
import { ModuleLoader } from "@/components/states/module-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ReportRangeKey, ReportRangeSelection } from "@/types/report";

function toDateInputValue(value: Date) {
  return value.toISOString().slice(0, 10);
}

function ComparisonIndicator({
  delta,
  suffix = "",
}: {
  delta: number | null;
  suffix?: string;
}) {
  if (delta === null) {
    return <p className="mt-2 text-sm text-muted-foreground">Sin base previa comparable</p>;
  }

  if (delta > 0) {
    return (
      <p className="mt-2 inline-flex items-center gap-1 text-sm text-emerald-600">
        <ArrowUpRight className="size-4" />
        +{delta}
        {suffix} vs periodo anterior
      </p>
    );
  }

  if (delta < 0) {
    return (
      <p className="mt-2 inline-flex items-center gap-1 text-sm text-rose-600">
        <ArrowDownRight className="size-4" />
        {delta}
        {suffix} vs periodo anterior
      </p>
    );
  }

  return (
    <p className="mt-2 inline-flex items-center gap-1 text-sm text-muted-foreground">
      <Minus className="size-4" />
      Sin cambio vs periodo anterior
    </p>
  );
}

export function ReportsModule() {
  const { workspace } = useAuth();
  const business = workspace?.business ?? businessConfig;
  const [pickerMode, setPickerMode] = useState<ReportRangeKey>("30d");
  const [selection, setSelection] = useState<ReportRangeSelection>({ rangeKey: "30d" });
  const [customStart, setCustomStart] = useState(() => toDateInputValue(subDays(new Date(), 29)));
  const [customEnd, setCustomEnd] = useState(() => toDateInputValue(new Date()));
  const { snapshot, loading } = useReportSnapshot(selection);
  const [exporting, setExporting] = useState(false);
  const customDatesInvalid = !customStart || !customEnd || customStart > customEnd;
  const customRangeDirty =
    pickerMode === "custom" &&
    (selection.rangeKey !== "custom" ||
      selection.customStart !== customStart ||
      selection.customEnd !== customEnd);

  function handlePresetSelect(nextRangeKey: Exclude<ReportRangeKey, "custom">) {
    setPickerMode(nextRangeKey);
    setSelection({ rangeKey: nextRangeKey });
  }

  function handleCustomMode() {
    setPickerMode("custom");

    if (selection.rangeKey === "custom") {
      setCustomStart(selection.customStart ?? customStart);
      setCustomEnd(selection.customEnd ?? customEnd);
    }
  }

  function applyCustomRange() {
    if (customDatesInvalid) {
      toast.error("El rango personalizado necesita una fecha inicial menor o igual a la final.");
      return;
    }

    setSelection({
      rangeKey: "custom",
      customStart,
      customEnd,
    });
  }

  function handleExport() {
    setExporting(true);
    const success = downloadReportSnapshotCsv(snapshot, business.name);
    setExporting(false);

    if (!success) {
      toast.error("La exportacion CSV solo esta disponible en navegador.");
      return;
    }

    toast.success("Reporte exportado en CSV.");
  }

  if (loading) {
    return <ModuleLoader />;
  }

  return (
    <PageShell
      title="Reportes basicos"
      description="Indicadores iniciales para decisiones rapidas, listos para ampliarse a vistas analiticas mas profundas."
      action={
        <div className="flex flex-wrap justify-end gap-2">
          {reportRangePresets.map((preset) => (
            <Button
              key={preset.key}
              variant={pickerMode === preset.key ? "default" : "outline"}
              size="sm"
              className="rounded-full px-4"
              onClick={() => handlePresetSelect(preset.key)}
            >
              {preset.label}
            </Button>
          ))}
          <Button
            variant={pickerMode === "custom" ? "default" : "outline"}
            size="sm"
            className="rounded-full px-4"
            onClick={handleCustomMode}
          >
            {customReportRangeOption.label}
          </Button>
          <Button variant="outline" className="rounded-full px-5" onClick={handleExport} disabled={exporting}>
            <Download />
            {exporting ? "Exportando..." : "Exportar CSV"}
          </Button>
        </div>
      }
    >
      {pickerMode === "custom" ? (
        <ModuleCard
          title="Rango personalizado"
          description="Define el rango que quieres analizar. La comparacion usara el periodo anterior con la misma duracion."
        >
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Fecha inicial</span>
              <Input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">Fecha final</span>
              <Input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} />
            </label>
            <Button className="rounded-full px-5" onClick={applyCustomRange} disabled={!customRangeDirty || customDatesInvalid}>
              Aplicar rango
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {customRangeDirty
              ? "Aplica las fechas para refrescar el snapshot y la exportacion."
              : "El rango activo ya esta sincronizado con el snapshot actual."}
          </p>
        </ModuleCard>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ModuleCard
          title="Ingresos"
          description={`Moneda activa: ${business.currency.code}. Periodo: ${snapshot.rangeLabel.toLowerCase()}.`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-3xl font-semibold">{formatCurrency(snapshot.metrics.revenue)}</p>
              <ComparisonIndicator delta={snapshot.comparison.metricChanges.revenue.deltaPercent} suffix="%" />
            </div>
            <Coins className="size-5 text-primary" />
          </div>
        </ModuleCard>
        <ModuleCard title="Clientes activos" description="Clientes con movimiento dentro del rango seleccionado.">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-3xl font-semibold">{snapshot.metrics.activeCustomers}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Del {formatDate(snapshot.rangeStart)} al {formatDate(snapshot.rangeEnd)}
              </p>
              <ComparisonIndicator delta={snapshot.comparison.metricChanges.activeCustomers.deltaPercent} suffix="%" />
            </div>
            <Users className="size-5 text-primary" />
          </div>
        </ModuleCard>
        <ModuleCard title="Citas en rango" description="Volumen operativo dentro del periodo.">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-3xl font-semibold">{snapshot.metrics.appointmentsCount}</p>
              <p className="mt-2 text-sm text-muted-foreground">Reservas entre las fechas seleccionadas</p>
              <ComparisonIndicator delta={snapshot.comparison.metricChanges.appointmentsCount.deltaPercent} suffix="%" />
            </div>
            <CalendarRange className="size-5 text-primary" />
          </div>
        </ModuleCard>
        <ModuleCard title="Conversion" description="Relacion entre ventas y agenda.">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-3xl font-semibold">{snapshot.metrics.conversionRate}%</p>
              <p className="mt-2 text-sm text-muted-foreground">Indicador comercial base</p>
              <ComparisonIndicator delta={snapshot.comparison.metricChanges.conversionRate.delta} suffix=" pts" />
            </div>
            <BarChart3 className="size-5 text-primary" />
          </div>
        </ModuleCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ModuleCard title="Ingresos por dia" description="Tendencia del periodo con lectura exportable.">
          <div className="max-h-96 space-y-3 overflow-auto pr-1">
            {snapshot.trend.map((item) => (
              <div key={item.date} className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
                </div>
                <p className="text-sm text-muted-foreground">{formatCurrency(item.revenue)}</p>
              </div>
            ))}
          </div>
        </ModuleCard>

        <ModuleCard title="Lectura ejecutiva" description="Resumen rapido para toma de decisiones.">
          {snapshot.sales.length > 0 || snapshot.appointments.length > 0 ? (
            <div className="space-y-3">
              <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                <p className="text-sm font-medium">Ventas registradas</p>
                <p className="mt-1 text-2xl font-semibold">{snapshot.sales.length}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                <p className="text-sm font-medium">Actividad en agenda</p>
                <p className="mt-1 text-2xl font-semibold">{snapshot.metrics.appointmentsCount}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                <p className="text-sm font-medium">Periodo analizado</p>
                <p className="mt-1 text-base font-semibold">
                  {formatDate(snapshot.rangeStart)} - {formatDate(snapshot.rangeEnd)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Comparado con {formatDate(snapshot.comparison.previousRangeStart)} - {formatDate(snapshot.comparison.previousRangeEnd)}
                </p>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={BarChart3}
              title="Aun no hay suficiente actividad"
              description="Cuando empieces a registrar ventas y reservas, este modulo mostrara mejor lectura operativa."
            />
          )}
        </ModuleCard>
      </div>
    </PageShell>
  );
}
