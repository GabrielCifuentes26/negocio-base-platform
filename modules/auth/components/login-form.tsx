"use client";

import { useEffect } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { businessConfig } from "@/config/business";
import { useAuth } from "@/hooks/use-auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, status, supabaseEnabled } = useAuth();
  const inviteToken = searchParams.get("invite");
  const nextPath = searchParams.get("next") || (inviteToken ? `/auth/accept-invitation?invite=${inviteToken}` : "/dashboard");

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "owner@negocio.com",
      password: "demo123",
    },
  });

  useEffect(() => {
    if (supabaseEnabled && status === "authenticated") {
      router.replace(nextPath);
    }
  }, [nextPath, router, status, supabaseEnabled]);

  async function onSubmit(values: LoginValues) {
    if (!supabaseEnabled) {
      toast.success("Modo demo activo. Continuando al dashboard base.");
      router.push(nextPath);
      return;
    }

    const result = await signIn(values);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Sesion iniciada. Cargando espacio de trabajo...");
  }

  return (
    <Card className="w-full rounded-[2rem] border-white/70 bg-white/85 shadow-[0_35px_80px_-45px_rgba(16,24,40,0.45)]">
      <CardHeader className="space-y-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="size-5" />
        </div>
        <CardTitle className="text-2xl">Acceso al producto base</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          {isSupabaseConfigured()
            ? "Supabase esta configurado. El formulario ya usa signInWithPassword desde el frontend."
            : "Modo demo activo. El flujo de acceso permite navegar mientras preparas Supabase Auth."}
        </p>
        {inviteToken ? (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
            Estas ingresando desde una invitacion. Inicia sesion con el correo invitado para activar tu acceso.
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <label className="space-y-2 text-sm">
            <span className="font-medium">Correo</span>
            <Input {...form.register("email")} />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium">Contrasena</span>
            <Input type="password" {...form.register("password")} />
          </label>
          <Button className="w-full rounded-full" size="lg" type="submit" disabled={form.formState.isSubmitting}>
            <LogIn />
            {form.formState.isSubmitting ? "Ingresando..." : "Ingresar"}
          </Button>
          <div className="rounded-2xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Negocio actual: <span className="font-medium text-foreground">{businessConfig.name}</span>
          </div>
          {!supabaseEnabled ? (
            <Link href="/dashboard" className="block text-center text-sm text-primary hover:underline">
              Continuar al dashboard demo
            </Link>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
