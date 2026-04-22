"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, Layers3, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { businessConfig } from "@/config/business";
import {
  businessTemplates,
  onboardingCurrencies,
  onboardingLocales,
  onboardingTimezones,
} from "@/config/onboarding";
import { platformModules } from "@/config/modules";
import { useAuth } from "@/hooks/use-auth";
import { bootstrapBusinessWorkspace } from "@/services/api/onboarding-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { ModuleLoader } from "@/components/states/module-loader";
import type { BusinessTemplateKey } from "@/types/onboarding";

const onboardingSchema = z.object({
  templateKey: z.enum(["barbershop", "salon", "clinic", "bookstore"]),
  businessName: z.string().min(2),
  contactEmail: z.email(),
  contactPhone: z.string().min(8),
  address: z.string().min(5),
  welcomeMessage: z.string().min(12),
  locale: z.string().min(2),
  currencyCode: z.string().min(2),
  timezone: z.string().min(2),
  modules: z.array(z.string()).min(1),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

const onboardingSteps = [
  { id: "template", label: "Plantilla", icon: Sparkles },
  { id: "business", label: "Negocio", icon: Building2 },
  { id: "modules", label: "Modulos", icon: Layers3 },
] as const;

function getTemplateByKey(templateKey: BusinessTemplateKey) {
  return businessTemplates.find((template) => template.key === templateKey) ?? businessTemplates[0];
}

export function OnboardingWizard() {
  const router = useRouter();
  const { status, supabaseEnabled, workspace, refreshWorkspace } = useAuth();
  const [step, setStep] = useState(0);

  const initialTemplate = businessTemplates[0];
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      templateKey: initialTemplate.key,
      businessName: "",
      contactEmail: businessConfig.contact.email,
      contactPhone: businessConfig.contact.phone,
      address: businessConfig.contact.address,
      welcomeMessage: initialTemplate.defaultWelcomeMessage,
      locale: businessConfig.locale,
      currencyCode: businessConfig.currency.code,
      timezone: "America/Guatemala",
      modules: initialTemplate.recommendedModules,
    },
  });

  const templateKey = useWatch({
    control: form.control,
    name: "templateKey",
    defaultValue: initialTemplate.key,
  });

  const selectedModules = useWatch({
    control: form.control,
    name: "modules",
    defaultValue: initialTemplate.recommendedModules,
  });

  const businessNamePreview = useWatch({
    control: form.control,
    name: "businessName",
    defaultValue: "",
  });

  const welcomeMessagePreview = useWatch({
    control: form.control,
    name: "welcomeMessage",
    defaultValue: initialTemplate.defaultWelcomeMessage,
  });

  const activeTemplate = getTemplateByKey(templateKey);

  useEffect(() => {
    if (workspace) {
      router.replace("/dashboard");
      return;
    }

    if (supabaseEnabled && status === "unauthenticated") {
      router.replace("/auth/login?next=/onboarding");
    }
  }, [router, status, supabaseEnabled, workspace]);

  function applyTemplate(templateKeyValue: BusinessTemplateKey) {
    const template = getTemplateByKey(templateKeyValue);

    form.setValue("templateKey", template.key, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    form.setValue("modules", template.recommendedModules, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    form.setValue("welcomeMessage", template.defaultWelcomeMessage, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  function toggleModule(moduleKey: string) {
    const currentModules = form.getValues("modules");
    const nextModules = currentModules.includes(moduleKey)
      ? currentModules.filter((item) => item !== moduleKey)
      : [...currentModules, moduleKey];

    form.setValue("modules", nextModules, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
  }

  async function handleNextStep() {
    if (step === 0) {
      const valid = await form.trigger(["templateKey", "businessName", "contactEmail", "contactPhone"]);

      if (valid) {
        setStep(1);
      }

      return;
    }

    if (step === 1) {
      const valid = await form.trigger(["address", "welcomeMessage", "locale", "currencyCode", "timezone"]);

      if (valid) {
        setStep(2);
      }
    }
  }

  async function onSubmit(values: OnboardingValues) {
    if (!supabaseEnabled) {
      toast.success("Modo demo activo. La base ya esta lista para explorar.");
      router.replace("/dashboard");
      return;
    }

    const result = await bootstrapBusinessWorkspace({
      businessName: values.businessName,
      contactEmail: values.contactEmail,
      contactPhone: values.contactPhone,
      address: values.address,
      welcomeMessage: values.welcomeMessage,
      locale: values.locale,
      currencyCode: values.currencyCode,
      timezone: values.timezone,
      modules: values.modules,
      primaryColor: activeTemplate.branding.primaryColor,
      accentColor: activeTemplate.branding.accentColor,
      fontFamily: activeTemplate.branding.fontFamily,
    });

    if (result.error) {
      toast.error(result.error);
      return;
    }

    await refreshWorkspace(result.businessId);
    toast.success("Negocio creado y espacio inicial listo.");
    router.replace("/dashboard");
  }

  if (status === "loading") {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-8">
        <ModuleLoader />
      </main>
    );
  }

  if (workspace) {
    return null;
  }

  if (supabaseEnabled && status === "unauthenticated") {
    return null;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-4">
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            Onboarding inicial del producto
          </Badge>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Crea tu primer negocio sin tocar la base de datos.
            </h1>
            <p className="text-sm leading-7 text-muted-foreground sm:text-base">
              Define una plantilla, datos operativos y modulos activos. La plataforma prepara negocio,
              branding, configuracion y membresia owner desde una sola accion.
            </p>
          </div>

          <div className="grid gap-3">
            {onboardingSteps.map((item, index) => {
              const Icon = item.icon;
              const isActive = index === step;
              const isCompleted = index < step;

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 rounded-3xl border px-4 py-4 ${
                    isActive ? "border-primary/30 bg-primary/5" : "border-white/70 bg-white/70"
                  }`}
                >
                  <div
                    className={`flex size-10 items-center justify-center rounded-2xl ${
                      isCompleted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="size-5" /> : <Icon className="size-5" />}
                  </div>
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {index === 0
                        ? "Escoge el tipo de negocio que mas se parece a tu cliente."
                        : index === 1
                          ? "Carga los datos principales para operar."
                          : "Activa modulos y revisa la configuracion inicial."}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <Card className="border-white/70 bg-white/80">
            <CardHeader>
              <CardTitle className="text-lg">Vista previa inicial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="rounded-[1.75rem] px-5 py-6 text-white"
                style={{ backgroundColor: activeTemplate.branding.primaryColor }}
              >
                <p className="text-xs uppercase tracking-[0.24em] opacity-80">{activeTemplate.label}</p>
                <p className="mt-3 text-2xl font-semibold">{businessNamePreview || "Tu negocio"}</p>
                <p className="mt-2 text-sm opacity-90">{welcomeMessagePreview}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedModules.map((moduleKey) => (
                  <Badge key={moduleKey} variant="outline">
                    {platformModules.find((module) => module.key === moduleKey)?.label ?? moduleKey}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <Card className="border-white/70 bg-white/85 shadow-[0_35px_80px_-45px_rgba(16,24,40,0.4)]">
          <CardHeader className="space-y-3">
            <CardTitle className="text-2xl">
              {step === 0 ? "Plantilla y datos base" : step === 1 ? "Operacion inicial" : "Revision final"}
            </CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              {step === 0
                ? "Selecciona la plantilla que mejor encaja con el negocio y carga los datos minimos."
                : step === 1
                  ? "Define zona horaria, moneda y mensaje inicial para dejar el espacio listo."
                  : "Activa los modulos que necesitas en el arranque y confirma la configuracion."}
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
              {step === 0 ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {businessTemplates.map((template) => {
                      const selected = template.key === templateKey;

                      return (
                        <button
                          key={template.key}
                          type="button"
                          onClick={() => applyTemplate(template.key)}
                          className={`rounded-3xl border px-4 py-4 text-left transition ${
                            selected ? "border-primary/40 bg-primary/5" : "border-border/70 bg-muted/20"
                          }`}
                        >
                          <p className="font-medium">{template.label}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 text-sm">
                      <span className="font-medium">Nombre comercial</span>
                      <Input {...form.register("businessName")} />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span className="font-medium">Correo principal</span>
                      <Input {...form.register("contactEmail")} />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span className="font-medium">Telefono</span>
                      <Input {...form.register("contactPhone")} />
                    </label>
                    <label className="space-y-2 text-sm">
                      <span className="font-medium">Direccion</span>
                      <Input {...form.register("address")} />
                    </label>
                  </div>
                </>
              ) : null}

              {step === 1 ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="space-y-2 text-sm">
                      <span className="font-medium">Idioma</span>
                      <NativeSelect {...form.register("locale")}>
                        {onboardingLocales.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </label>
                    <label className="space-y-2 text-sm">
                      <span className="font-medium">Moneda</span>
                      <NativeSelect {...form.register("currencyCode")}>
                        {onboardingCurrencies.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </label>
                    <label className="space-y-2 text-sm">
                      <span className="font-medium">Zona horaria</span>
                      <NativeSelect {...form.register("timezone")}>
                        {onboardingTimezones.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </label>
                  </div>
                  <label className="space-y-2 text-sm">
                    <span className="font-medium">Mensaje de bienvenida</span>
                    <Textarea rows={5} {...form.register("welcomeMessage")} />
                  </label>
                </>
              ) : null}

              {step === 2 ? (
                <div className="space-y-4">
                  <div className="grid gap-2">
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

                  <div className="rounded-3xl border border-dashed border-border/80 bg-muted/20 p-4 text-sm text-muted-foreground">
                    Si llegaste por una invitacion a otro negocio, puedes aceptarla despues con el enlace recibido y
                    tu cuenta mantendra acceso a multiples espacios.
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-between">
                <div className="flex gap-2">
                  {step > 0 ? (
                    <Button type="button" variant="outline" className="rounded-full px-5" onClick={() => setStep(step - 1)}>
                      <ArrowLeft />
                      Anterior
                    </Button>
                  ) : (
                    <Link href="/auth/login" className="inline-flex">
                      <Button type="button" variant="outline" className="rounded-full px-5">
                        <ArrowLeft />
                        Volver
                      </Button>
                    </Link>
                  )}
                </div>

                {step < onboardingSteps.length - 1 ? (
                  <Button type="button" className="rounded-full px-5" onClick={() => void handleNextStep()}>
                    Continuar
                    <ArrowRight />
                  </Button>
                ) : (
                  <Button type="submit" className="rounded-full px-5" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Creando negocio..." : "Crear negocio"}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
