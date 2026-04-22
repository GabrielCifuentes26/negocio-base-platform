import Link from "next/link";
import {
  ArrowRight,
  CalendarRange,
  Paintbrush2,
  ShieldCheck,
  ShoppingBag,
  Users,
} from "lucide-react";

import { businessConfig } from "@/config/business";
import { platformModules } from "@/config/modules";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const highlights = [
  {
    title: "Multi-negocio real",
    description:
      "Branding, textos, moneda, horarios y módulos activables desde configuración centralizada.",
    icon: Paintbrush2,
  },
  {
    title: "Operación diaria simple",
    description:
      "Clientes, servicios, productos, citas, ventas y reportes básicos en una base única.",
    icon: CalendarRange,
  },
  {
    title: "Escalable a SaaS",
    description:
      "Arquitectura modular, capa de datos desacoplada y estructura preparada para roles, RLS y tenancy.",
    icon: ShieldCheck,
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/75 px-5 py-8 shadow-[0_30px_80px_-40px_rgba(16,24,40,0.35)] backdrop-blur sm:px-8 sm:py-10">
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-primary/10 via-transparent to-amber-300/15" />
        <div className="relative space-y-6">
          <Badge variant="secondary" className="rounded-full px-3 py-1">
            Base SaaS reusable para negocios de servicio y retail
          </Badge>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              {businessConfig.name} convierte una plantilla en un producto adaptable.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              Diseñada para barberías, salones, clínicas, librerías y otros pequeños negocios
              que necesitan una plataforma moderna, clara y fácil de personalizar sin rehacer la
              arquitectura.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ size: "lg" }), "rounded-full px-5")}
            >
              Entrar al dashboard base
              <ArrowRight />
            </Link>
            <Link
              href="/auth/login"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full px-5")}
            >
              Ver flujo de autenticación
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="border-none bg-muted/70 shadow-none">
              <CardContent className="flex items-center gap-3 p-4">
                <Users className="size-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Clientes y empleados</p>
                  <p className="text-xs text-muted-foreground">Gestión reusable por módulo</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none bg-muted/70 shadow-none">
              <CardContent className="flex items-center gap-3 p-4">
                <CalendarRange className="size-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Reservas y agenda</p>
                  <p className="text-xs text-muted-foreground">Preparado para slots y estados</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none bg-muted/70 shadow-none">
              <CardContent className="flex items-center gap-3 p-4">
                <ShoppingBag className="size-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold">Ventas y catálogo</p>
                  <p className="text-xs text-muted-foreground">Servicios y productos desacoplados</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="grid gap-4 py-8 sm:grid-cols-3">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="border-white/70 bg-white/75 backdrop-blur">
              <CardHeader className="space-y-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="pb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Módulos incluidos en la base</h2>
            <p className="text-sm text-muted-foreground">
              Se activan o desactivan desde configuración sin hardcodeo en pantalla.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {platformModules.map((module) => (
            <Card key={module.key} className="border-white/70 bg-white/75">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{module.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{module.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
