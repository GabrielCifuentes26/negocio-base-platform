"use client";

import { useEffect } from "react";
import { LayoutPanelLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { useModuleAccess } from "@/hooks/use-module-access";
import { EmptyState } from "@/components/states/empty-state";

export function ModuleAccessGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isEnabled, defaultHref, enabledModules } = useModuleAccess();

  useEffect(() => {
    if (!pathname || isEnabled(pathname)) {
      return;
    }

    router.replace(defaultHref);
  }, [defaultHref, isEnabled, pathname, router]);

  if (enabledModules.length === 0) {
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
