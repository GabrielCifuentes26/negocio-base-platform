"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NavigationItem } from "@/types/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function SidebarNav({
  businessName,
  logoText,
  navigation,
}: {
  businessName: string;
  logoText: string;
  navigation: NavigationItem[];
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-4 border-b border-sidebar-border px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <span className="text-lg font-semibold">{logoText}</span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">Plataforma base</p>
            <h2 className="text-base font-semibold">{businessName}</h2>
          </div>
        </div>
        <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px]">
          adaptable a múltiples industrias
        </Badge>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/15"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              <Icon className="size-4" />
              <div className="min-w-0">
                <p className="font-medium">{item.label}</p>
                <p className={cn("truncate text-xs", isActive ? "text-primary-foreground/70" : "text-muted-foreground")}>
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
