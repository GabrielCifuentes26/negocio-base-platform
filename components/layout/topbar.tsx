"use client";

import { Bell, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { businessConfig } from "@/config/business";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceSwitcher } from "@/components/layout/workspace-switcher";

export function Topbar() {
  const router = useRouter();
  const { status, supabaseEnabled, user, workspace, signOut } = useAuth();
  const businessName = workspace?.business.name ?? businessConfig.name;
  const userName = user?.fullName ?? "Administrador";
  const userEmail = user?.email ?? "owner@negocio.com";

  async function handleSignOut() {
    const result = await signOut();

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Sesion cerrada.");
    router.replace("/auth/login");
  }

  return (
    <header className="sticky top-0 z-20 hidden border-b border-white/40 bg-background/85 backdrop-blur lg:block">
      <div className="flex items-center justify-between gap-4 px-8 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Producto base</p>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{businessName}</h1>
            <Badge variant={supabaseEnabled ? "outline" : "secondary"}>
              {supabaseEnabled ? status : "demo"}
            </Badge>
          </div>
          <div className="mt-2">
            <WorkspaceSwitcher />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden w-80 xl:block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="rounded-full bg-white pl-9" placeholder="Buscar clientes, citas o productos" />
          </div>
          <Button variant="outline" size="icon-sm" aria-label="Notificaciones">
            <Bell />
          </Button>
          <div className="flex items-center gap-3 rounded-full border bg-white px-2.5 py-1.5">
            <Avatar className="size-9">
              <AvatarFallback>{userName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="hidden text-sm xl:block">
              <p className="font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
          </div>
          {supabaseEnabled ? (
            <Button variant="outline" className="rounded-full px-4" onClick={() => void handleSignOut()}>
              Salir
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
