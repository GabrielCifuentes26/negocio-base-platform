# Setup

## Requisitos

- Node.js 20+
- npm 10+
- cuenta de Supabase

## Instalacion

```bash
npm install
npm run dev
```

## Variables de entorno

Copia `.env.example` y completa:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=brand-assets
NEXT_PUBLIC_ENABLE_INVITATION_EMAILS=false
NEXT_PUBLIC_BASE_PATH=
```

## GitHub Pages

Esta base esta preparada para export estatico.

Si publicas en GitHub Pages dentro de un repositorio de proyecto, define:

```bash
NEXT_PUBLIC_BASE_PATH=/nombre-del-repo
```

Luego ejecuta:

```bash
npm run build
```

El resultado exportado se genera en `out/`.

## Workflow incluido

Tambien queda listo un workflow de Pages en:

```txt
.github/workflows/deploy-pages.yml
```

Recomendacion:

1. activa GitHub Pages en el repositorio usando GitHub Actions como source
2. agrega los secrets `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` y `NEXT_PUBLIC_ENABLE_INVITATION_EMAILS` si usaras Supabase en produccion
3. publica a `main`

## Supabase

1. Ejecuta las migraciones de `database/migrations/` en orden.
2. Aplica los seeds de `database/seeds/`.
3. Crea usuarios en Supabase Auth.
4. Verifica que cada usuario tenga `profile`.
5. Asigna una fila activa en `business_memberships` o crea una invitacion pendiente.
6. Configura Auth y proveedores segun tu necesidad.

Migraciones clave:

- `001_initial_schema.sql`: tablas base del producto
- `002_platform_helpers_and_rls.sql`: triggers `updated_at` y helpers de acceso
- `003_profiles_and_roles_bootstrap.sql`: perfiles automaticos desde `auth.users`, roles de sistema y permisos base
- `004_permissions_expansion.sql`: ampliacion de permisos para usuarios y roles
- `005_business_invitations.sql`: tabla de invitaciones internas
- `006_invitation_acceptance_flow.sql`: token de invitacion + RPC `accept_business_invitation`
- `007_brand_assets_storage.sql`: bucket publico `brand-assets` y policies para Storage
- `008_business_onboarding_bootstrap.sql`: RPC para crear negocio, branding, settings y membresia owner
- `009_profile_preferred_business.sql`: persistencia server-side del negocio activo preferido

## Flujo actual de autenticacion e invitaciones

- si no hay variables de Supabase, la app funciona en modo demo
- si existen `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`, el login usa `signInWithPassword`
- la plataforma interna se protege con un guard cliente
- el negocio activo se resuelve desde `business_memberships`, `businesses`, `business_settings` y `business_branding`
- si el usuario tiene acceso a multiples negocios, puede cambiar el negocio activo desde el selector de la interfaz
- la preferencia del negocio activo se guarda tanto en localStorage como en `profiles.preferred_business_id`
- una invitacion genera un enlace como `/auth/accept-invitation?invite=...`
- el usuario inicia sesion con el correo invitado y acepta el acceso desde la app
- la RPC crea o reactiva la membresia y marca la invitacion como aceptada
- si el usuario no tiene negocios activos, el guard lo redirige al onboarding inicial `/onboarding`
- el onboarding crea el primer negocio desde la UI con branding y modulos iniciales

## Branding y Storage

- el formulario de branding sigue aceptando URLs manuales
- tambien puede subir logo e imagen principal a Supabase Storage
- el bucket por defecto es `brand-assets`
- la ruta del archivo usa el prefijo `business_id/` para que las policies validen acceso por negocio

## Edge Function para invitaciones

El repositorio ya incluye:

```txt
supabase/functions/send-business-invitation/index.ts
```

Para activarla:

1. configura `NEXT_PUBLIC_ENABLE_INVITATION_EMAILS=true` en el frontend
2. despliega la funcion con Supabase CLI
3. agrega los secretos `RESEND_API_KEY` e `INVITATION_FROM_EMAIL`

Ejemplo:

```bash
supabase functions deploy send-business-invitation
supabase secrets set RESEND_API_KEY=tu_clave
supabase secrets set INVITATION_FROM_EMAIL="Invitaciones <invitaciones@tu-dominio.com>"
```
