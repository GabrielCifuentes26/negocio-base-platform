# Negocio Base Platform

Base reusable para construir plataformas web de pequenos negocios con una sola arquitectura adaptable a barberias, salones, clinicas, librerias y otros modelos similares.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase

## Objetivo

Entregar una base:

- reusable
- modular
- escalable
- mobile-first
- facil de tematizar
- lista para GitHub Pages hoy y Vercel manana
- con modo demo y modo Supabase real

## Modulos incluidos

- autenticacion
- dashboard
- clientes
- servicios
- productos
- reservas
- ventas
- usuarios
- roles y permisos
- configuracion del negocio
- branding
- reportes

## Arquitectura resumida

- `app/`: rutas y layouts
- `components/`: UI reusable
- `modules/`: dominios funcionales
- `config/`: negocio, modulos y producto
- `lib/`: utilidades transversales
- `services/`: datos demo + base para Supabase
- `database/`: SQL inicial y migraciones
- `docs/`: documentacion de arquitectura y operacion

## Desarrollo

```bash
npm install
npm run dev
```

## Deploy a GitHub Pages

La base ya incluye workflow en `.github/workflows/deploy-pages.yml`.

- si el repositorio es de proyecto, el `basePath` se infiere automaticamente en GitHub Actions
- si quieres forzarlo localmente, usa `NEXT_PUBLIC_BASE_PATH`
- si vas a usar Supabase en produccion, crea los secrets:
  `NEXT_PUBLIC_SUPABASE_URL`
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`

## Estado actual

- auth demo lista por defecto
- auth real con Supabase `signInWithPassword`
- guard de acceso para la zona interna
- carga de workspace activo desde membresias
- clientes, servicios, productos, reservas y ventas conectables a Supabase sin backend Node
- dashboard con metricas derivadas de datos reales cuando Supabase esta activo
- users, roles y reportes conectados a datos reales
- branding editable y modulos activos persistidos por negocio
- navegacion y acceso filtrados por modulos activos y permisos
- invitaciones internas con enlace de acceso y aceptacion real desde RPC
- envio opcional de invitaciones por correo via Supabase Edge Functions
- branding con subida de assets a Supabase Storage
- selector de negocio activo para usuarios con multiples membresias
- negocio preferido persistido tambien en el perfil del usuario
- onboarding inicial para crear el primer negocio desde la app

## Variables de entorno

Revisa `.env.example`.

## Documentacion

- [Arquitectura](./docs/architecture.md)
- [Estructura de carpetas](./docs/folder-structure.md)
- [Theming](./docs/theming.md)
- [Setup](./docs/setup.md)
- [Escalabilidad futura](./docs/future-scaling.md)
- [Handoff 2026-04-22](./docs/session-handoff-2026-04-22.md)
