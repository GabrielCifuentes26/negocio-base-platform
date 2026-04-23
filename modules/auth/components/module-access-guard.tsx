"use client";

import { useEffect } from "react";
import { LayoutPanelLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { useModuleAccess } from "@/hooks/use-module-access";
import { EmptyState } from "@/components/states/empty-state";

export function ModuleAccessGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { activeModuleKeys, isEnabled, defaultHref, enabledModules } = useModuleAccess();
  const hasConfiguredModules = activeModuleKeys.length > 0;
  const hasAccessibleModules = enabledModules.length > 0;

  useEffect(() => {
    if (!pathname || !hasAccessibleModules || isEnabled(pathname)) {
      return;
    }

    router.replace(defaultHref);
  }, [defaultHref, hasAccessibleModules, isEnabled, pathname, router]);

  if (!hasConfiguredModules) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-6">
        <EmptyState
          icon={LayoutPanelLeft}
          title="No hay modulos activos"
          description="Activa al menos un modulo en la configuracion del negocio para usar la plataforma."
        />
      </main>
    );
  }

  if (!hasAccessibleModules) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-6">
        <EmptyState
          icon={LayoutPanelLeft}
          title="Tu rol no tiene acceso a modulos activos"
          description="Pide a un administrador que ajuste tus permisos o habilite un modulo compatible con tu rol."
        />
      </main>
    );
  }

  if (pathname && !isEnabled(pathname)) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-6">
        <EmptyState
          icon={LayoutPanelLeft}
          title="Modulo desactivado para este negocio"
          description="Redirigiendo al primer modulo disponible dentro del espacio de trabajo."
        />
      </main>
    );
  }

  return <>{children}</>;
}
