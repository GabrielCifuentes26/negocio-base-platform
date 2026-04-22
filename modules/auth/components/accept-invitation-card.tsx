"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LoaderCircle, MailCheck, ShieldAlert } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { acceptInvitation } from "@/services/api/invitation-service";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AcceptInvitationCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, supabaseEnabled, refreshWorkspace } = useAuth();
  const inviteToken = searchParams.get("invite") ?? "";
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!supabaseEnabled || !inviteToken || status !== "unauthenticated") {
      return;
    }

    router.replace(`/auth/login?invite=${encodeURIComponent(inviteToken)}`);
  }, [inviteToken, router, status, supabaseEnabled]);

  async function handleAccept() {
    if (!inviteToken) {
      toast.error("No se encontro un token de invitacion valido.");
      return;
    }

    setSubmitting(true);
    const result = await acceptInvitation(inviteToken);
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setAccepted(true);
    toast.success("Invitacion aceptada correctamente.");

    await refreshWorkspace(result.businessId);
    router.replace("/dashboard");
  }

  if (!supabaseEnabled) {
    return (
      <Card className="w-full rounded-[2rem] border-white/70 bg-white/85 shadow-[0_35px_80px_-45px_rgba(16,24,40,0.45)]">
        <CardContent className="p-8">
          <EmptyState
            icon={ShieldAlert}
            title="La aceptacion real requiere Supabase"
            description="Este flujo funciona cuando Auth, base de datos y RPC estan activos en tu proyecto."
          />
        </CardContent>
      </Card>
    );
  }

  if (!inviteToken) {
    return (
      <Card className="w-full rounded-[2rem] border-white/70 bg-white/85 shadow-[0_35px_80px_-45px_rgba(16,24,40,0.45)]">
        <CardContent className="p-8">
          <EmptyState
            icon={ShieldAlert}
            title="Enlace de invitacion invalido"
            description="El acceso necesita un token valido en la URL para poder continuar."
          />
        </CardContent>
      </Card>
    );
  }

  if (status === "loading") {
    return (
      <Card className="w-full rounded-[2rem] border-white/70 bg-white/85 shadow-[0_35px_80px_-45px_rgba(16,24,40,0.45)]">
        <CardContent className="flex min-h-72 items-center justify-center p-8">
          <LoaderCircle className="size-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (status === "unauthenticated") {
    return (
      <Card className="w-full rounded-[2rem] border-white/70 bg-white/85 shadow-[0_35px_80px_-45px_rgba(16,24,40,0.45)]">
        <CardContent className="p-8">
          <EmptyState
            icon={MailCheck}
            title="Redirigiendo a inicio de sesion"
            description="Necesitas autenticarte con el correo invitado antes de aceptar el acceso."
          />
        </CardContent>
      </Card>
    );
  }

  if (accepted) {
    return (
      <Card className="w-full rounded-[2rem] border-white/70 bg-white/85 shadow-[0_35px_80px_-45px_rgba(16,24,40,0.45)]">
        <CardHeader className="space-y-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MailCheck className="size-5" />
          </div>
          <CardTitle className="text-2xl">Acceso activado</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            La membresia ya fue aceptada. Si ya tenias otro negocio activo, el acceso nuevo quedo agregado a tu cuenta.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full rounded-full" onClick={() => router.push("/dashboard")}>
            Ir al dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full rounded-[2rem] border-white/70 bg-white/85 shadow-[0_35px_80px_-45px_rgba(16,24,40,0.45)]">
      <CardHeader className="space-y-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <MailCheck className="size-5" />
        </div>
        <CardTitle className="text-2xl">Aceptar invitacion</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          Confirma el acceso al negocio con tu sesion actual. El sistema validara que tu correo coincida con la invitacion.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button className="w-full rounded-full" onClick={() => void handleAccept()} disabled={submitting}>
          {submitting ? "Activando acceso..." : "Aceptar acceso"}
        </Button>
        <Link href="/auth/login" className="block text-center text-sm text-primary hover:underline">
          Cambiar de cuenta
        </Link>
      </CardContent>
    </Card>
  );
}
