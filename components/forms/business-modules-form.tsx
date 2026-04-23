"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { platformModules } from "@/config/modules";
import { useAuth } from "@/hooks/use-auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { updateWorkspaceModules } from "@/services/api/workspace-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function BusinessModulesForm({ readOnly = false }: { readOnly?: boolean }) {
  const { workspace, refreshWorkspace, supabaseEnabled } = useAuth();
  const baseModules = useMemo(
    () => workspace?.business.modules ?? platformModules.map((module) => module.key),
    [workspace?.business.modules],
  );
  const [draftModules, setDraftModules] = useState<string[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const selectedModules = draftModules ?? baseModules;

  function toggleModule(moduleKey: string) {
    setDraftModules((currentDraft) => {
      const current = currentDraft ?? baseModules;
      return current.includes(moduleKey)
        ? current.filter((item) => item !== moduleKey)
        : [...current, moduleKey];
    });
  }

  async function handleSave() {
    if (!supabaseEnabled || !workspace || workspace.mode === "demo") {
      toast.success("Modulos validados en modo demo.");
      return;
    }

    const client = getSupabaseBrowserClient();

    if (!client) {
      toast.error("No se pudo inicializar Supabase.");
      return;
    }

    setSubmitting(true);
    const result = await updateWorkspaceModules(client, workspace.businessId, {
      modules: selectedModules,
    });

    if (result.error) {
      toast.error(result.error);
      setSubmitting(false);
      return;
    }

    await refreshWorkspace();
    setDraftModules(null);
    setSubmitting(false);
    toast.success("Modulos actualizados.");
  }

  return (
    <Card className="border-white/70 bg-white/80">
      <CardContent className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {platformModules.map((module) => {
            const checked = selectedModules.includes(module.key);

            return (
              <label
                key={module.key}
                className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleModule(module.key)}
                  disabled={readOnly}
                  className="mt-1 size-4 rounded border-border"
                />
                <span>
                  <span className="block font-medium">{module.label}</span>
                  <span className="block text-muted-foreground">{module.description}</span>
                </span>
              </label>
            );
          })}
        </div>
        {readOnly ? (
          <p className="text-sm text-muted-foreground">
            Tu rol actual puede ver los modulos activos, pero no modificarlos.
          </p>
        ) : null}
        <Button className="rounded-full px-5" onClick={() => void handleSave()} disabled={readOnly || submitting}>
          {submitting ? "Guardando..." : "Guardar modulos"}
        </Button>
      </CardContent>
    </Card>
  );
}
