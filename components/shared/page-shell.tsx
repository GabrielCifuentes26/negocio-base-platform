import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

export function PageShell({
  title,
  description,
  actionLabel,
  action,
  children,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Módulo</p>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {action ? (
          action
        ) : actionLabel ? (
          <Button size="lg" className="rounded-full px-5">
            {actionLabel}
          </Button>
        ) : null}
      </div>
      {children}
    </section>
  );
}
