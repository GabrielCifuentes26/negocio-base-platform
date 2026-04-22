"use client";

import { PanelLeft } from "lucide-react";

import { businessConfig } from "@/config/business";
import { useAuth } from "@/hooks/use-auth";
import { useModuleAccess } from "@/hooks/use-module-access";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useMobile } from "@/hooks/use-mobile";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";

export function AppShell({ children }: { children: React.ReactNode }) {
  const isMobile = useMobile();
  const { workspace } = useAuth();
  const { enabledNavigation } = useModuleAccess();
  const businessName = workspace?.business.name ?? businessConfig.name;
  const logoText = workspace?.business.branding.logoText ?? businessConfig.branding.logoText;

  return (
    <div className="flex min-h-screen bg-transparent">
      <aside className="hidden w-72 shrink-0 border-r border-sidebar-border bg-sidebar lg:flex">
        <SidebarNav businessName={businessName} logoText={logoText} navigation={enabledNavigation} />
      </aside>
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-white/40 bg-background/85 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Base SaaS</p>
              <p className="text-sm font-semibold">{businessName}</p>
              <div className="mt-2">
                <WorkspaceSwitcher compact />
              </div>
            </div>
            <Sheet>
              <SheetTrigger
                render={
                  <Button variant="outline" size="icon-sm" aria-label="Abrir menu">
                    <PanelLeft />
                  </Button>
                }
              />
              <SheetContent side="left" className="w-[88vw] max-w-sm bg-sidebar p-0">
                <SidebarNav businessName={businessName} logoText={logoText} navigation={enabledNavigation} />
              </SheetContent>
            </Sheet>
          </div>
          {isMobile ? <Separator /> : null}
        </header>
        <Topbar />
        <div className="flex-1 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">{children}</div>
      </div>
    </div>
  );
}
