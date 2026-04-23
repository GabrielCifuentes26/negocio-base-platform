# Session Handoff 2026-04-22

## Ultima actualizacion

Actualizado al cierre de la sesion con:

- repositorio publico en GitHub
- GitHub Pages activo por workflow
- deploy exitoso en la rama `main`
- ultimo commit funcional de despliegue: `179b376 fix: enable github pages during deploy`
- ultimo bloque tecnico previo a esta tanda: `737c1ff feat: harden admin permissions and rls`
- este handoff ya describe cambios posteriores de testing y seguridad aunque el hash exacto mas reciente debe confirmarse con `git log -1 --oneline`

## Objetivo del proyecto

Construir una base reusable para pequenos negocios con:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- despliegue estatico inicial compatible con GitHub Pages

La idea no es hacer un sistema para un solo negocio, sino una plataforma adaptable a barberias, salones, clinicas, librerias y otros negocios pequenos.

## Estado actual

La base ya esta avanzada y funcional.

Puntos fuertes ya cerrados:

- arquitectura modular reusable
- shell responsive mobile-first
- auth con Supabase y modo demo
- modulos principales conectados
- multi-negocio con selector de negocio activo
- branding configurable con Storage
- invitaciones internas con aceptacion real
- onboarding inicial del primer negocio
- editor de permisos por rol
- CI con lint, typecheck, test y build
- deploy a GitHub Pages

## Estado del repositorio y despliegue

- repositorio GitHub: `https://github.com/GabrielCifuentes26/negocio-base-platform`
- visibilidad actual: `public`
- rama principal: `main`
- ultimo commit remoto actual: confirmar con `git log -1 --oneline` o revisando GitHub al retomar
- GitHub Pages publicado en: `https://gabrielcifuentes26.github.io/negocio-base-platform/`
- ultimo workflow de CI: `success`
- ultimo workflow de Pages: `success`

## Rutas principales

- `/`: landing del producto base
- `/auth/login`: acceso con Supabase o modo demo
- `/auth/accept-invitation`: aceptacion de invitaciones por token
- `/onboarding`: alta del primer negocio cuando el usuario aun no tiene workspace
- `/dashboard`
- `/customers`
- `/services`
- `/products`
- `/appointments`
- `/sales`
- `/users`
- `/roles`
- `/settings`
- `/branding`
- `/reports`

## Modulos y estado

- `dashboard`: operativo
- `customers`: lectura y creacion base
- `services`: lectura y creacion base
- `products`: lectura y creacion base
- `appointments`: lectura y creacion base
- `sales`: lectura y creacion base
- `users`: listado, cambio de rol e invitaciones
- `roles`: listado, creacion y edicion de permisos para roles personalizados
- `settings`: datos del negocio y modulos activos
- `branding`: tokens visuales y subida de assets
- `reports`: base conectada a metricas del dashboard

## Lo implementado hoy y en esta sesion

1. Invitaciones y onboarding

- flujo real de aceptacion de invitaciones con `/auth/accept-invitation`
- RPC para aceptar invitaciones y crear o reactivar membresia
- onboarding inicial en `/onboarding` para crear el primer negocio desde la UI
- guard que redirige a onboarding cuando el usuario no tiene un negocio activo

2. Branding y assets

- formulario de branding conectado
- subida de logo e imagen principal a Supabase Storage

3. Multi-negocio

- carga de multiples membresias activas por usuario
- selector de negocio activo en desktop y mobile
- negocio preferido persistido en `profiles.preferred_business_id`
- fallback adicional en localStorage

4. Roles y permisos

- permisos cargados por rol
- editor visual para roles personalizados
- roles de sistema en modo solo lectura

5. Correo de invitaciones

- cliente preparado para invocar una Edge Function opcional
- funcion incluida en `supabase/functions/send-business-invitation/index.ts`
- proveedor pensado: Resend

6. Calidad y automatizacion

- `lint`, `typecheck`, `test` y `build` configurados
- workflow CI agregado en `.github/workflows/ci.yml`
- workflow de GitHub Pages ya presente
- pruebas unitarias base con Vitest
- pruebas nuevas para `workspace-preferences`, `workspace-service`, `onboarding-service` e `invitation-service`
- pruebas UI con `jsdom` y `@testing-library/react` para `auth-context`, `auth-guard` y `workspace-switcher`

7. Seguridad y permisos

- catalogo central de permisos por accion en `lib/permissions/catalog.ts`
- compatibilidad temporal con permisos legacy como `manage_users`, `manage_roles` y `manage_settings`
- UI sensible alineada a lectura versus edicion en users, roles, settings y branding
- migracion nueva para permisos por accion y endurecimiento de RLS administrativa
- UI operativa alineada a permisos de creacion en customers, services, products, appointments y sales
- migracion nueva para endurecer escritura operativa por accion sin bloquear lectura de golpe
- acceso por modulo alineado ya con permisos de lectura en dashboard y modulos operativos
- roles personalizados normalizan dependencias minimas de lectura cuando se asignan permisos de escritura o gestion
- migracion nueva para endurecer tambien la lectura operativa por accion en tablas principales
- RPC nuevas para `appointments` y `sales` en escenarios con lecturas cruzadas entre modulos
- servicios frontend de citas y ventas preparados para usar RPC con fallback temporal a consultas directas mientras la migracion no exista

## Migraciones importantes

Orden actual de migraciones:

- `001_initial_schema.sql`
- `002_platform_helpers_and_rls.sql`
- `003_profiles_and_roles_bootstrap.sql`
- `004_permissions_expansion.sql`
- `005_business_invitations.sql`
- `006_invitation_acceptance_flow.sql`
- `007_brand_assets_storage.sql`
- `008_business_onboarding_bootstrap.sql`
- `009_profile_preferred_business.sql`
- `010_action_permissions_and_admin_rls.sql`
- `011_operational_write_permissions.sql`
- `012_rpc_and_business_consistency_hardening.sql`
- `013_operational_read_permissions.sql`
- `014_operational_cross_module_rpcs.sql`

Resumen de las ultimas:

- `006`: token + aceptacion de invitaciones
- `007`: Storage para branding
- `008`: bootstrap del primer negocio
- `009`: negocio preferido persistido en perfil
- `010`: permisos por accion, helper SQL de permisos y RLS administrativa mas fina para branding, settings, roles, memberships e invitaciones
- `011`: politicas de escritura por accion para customers, services, products, appointments, appointment_services, sales y sale_items
- `012`: validacion de consistencia entre negocio, rol y membresia; onboarding e invitaciones sincronizan tambien `preferred_business_id`
- `013`: politicas de lectura por accion para customers, services, products, appointments, appointment_services, sales y sale_items
- `014`: RPC seguras para opciones, listados y creacion de citas y ventas cuando la operacion depende de datos de otros modulos

## Variables de entorno actuales

Archivo base: `.env.example`

Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_ENABLE_INVITATION_EMAILS`
- `NEXT_PUBLIC_BASE_PATH`

## Archivos clave para retomar rapido

- `lib/auth/auth-context.tsx`
- `services/api/workspace-service.ts`
- `services/api/invitation-service.ts`
- `services/api/onboarding-service.ts`
- `services/api/appointment-service.ts`
- `services/api/sale-service.ts`
- `modules/onboarding/components/onboarding-wizard.tsx`
- `modules/auth/components/auth-guard.tsx`
- `modules/auth/components/accept-invitation-card.tsx`
- `lib/permissions/catalog.ts`
- `lib/permissions/ability.ts`
- `modules/roles/components/role-permissions-editor.tsx`
- `modules/roles/components/create-role-dialog.tsx`
- `modules/auth/components/module-access-guard.tsx`
- `components/layout/workspace-switcher.tsx`
- `modules/customers/components/customers-module.tsx`
- `modules/services/components/services-module.tsx`
- `modules/products/components/products-module.tsx`
- `modules/appointments/components/appointments-module.tsx`
- `modules/sales/components/sales-module.tsx`
- `components/forms/business-settings-form.tsx`
- `components/forms/business-modules-form.tsx`
- `components/forms/branding-settings-form.tsx`
- `database/migrations/008_business_onboarding_bootstrap.sql`
- `database/migrations/009_profile_preferred_business.sql`
- `database/migrations/010_action_permissions_and_admin_rls.sql`
- `database/migrations/011_operational_write_permissions.sql`
- `database/migrations/012_rpc_and_business_consistency_hardening.sql`
- `database/migrations/013_operational_read_permissions.sql`
- `database/migrations/014_operational_cross_module_rpcs.sql`
- `lib/supabase/rpc.ts`
- `supabase/functions/send-business-invitation/index.ts`

## Validacion actual

Ultima verificacion completada en verde:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## Cobertura de pruebas agregada al final de la sesion

Quedo cubierta una parte importante de los flujos criticos:

- persistencia local del negocio preferido
- bootstrap del onboarding via RPC
- construccion y aceptacion de invitaciones
- listado de invitaciones con mapeo de roles y links
- resolucion del workspace activo segun negocio preferido
- persistencia de preferencia de negocio via RPC

Archivos nuevos de pruebas:

- `tests/lib/auth/workspace-preferences.test.ts`
- `tests/lib/permissions/ability.test.ts`
- `tests/lib/permissions/catalog.test.ts`
- `tests/lib/auth/auth-context.test.tsx`
- `tests/modules/auth/auth-guard.test.tsx`
- `tests/components/layout/workspace-switcher.test.tsx`
- `tests/services/api/onboarding-service.test.ts`
- `tests/services/api/invitation-service.test.ts`
- `tests/services/api/workspace-service.test.ts`
- `tests/services/api/appointment-service.test.ts`
- `tests/services/api/sale-service.test.ts`

## Documento detallado de lo que falta

Para continuar sin perder contexto ni omitir pasos, revisar tambien:

- `docs/future-scaling.md`

Ese documento ya no es un resumen corto. Incluye:

- frentes pendientes
- orden recomendado de construccion
- riesgos si se saltan pasos
- criterios de cierre
- modulos que aun deben profundizarse
- estrategia sugerida para seguridad, pruebas, onboarding, correo, reportes y escalado SaaS

## Siguiente paso recomendado

Prioridad sugerida para la proxima sesion:

1. subir el nivel de pruebas
   siguiente bloque sugerido: componentes criticos de onboarding y formularios operativos principales, incluyendo dependencias entre permisos y formularios

2. endurecer seguridad
   siguiente bloque sugerido: extender el patron de RPC controladas a otros casos complejos o revisar si `customers` y `products` necesitan operaciones equivalentes mas adelante

3. mejorar onboarding
   agregar horarios iniciales, servicios base sugeridos y presets por industria

4. mejorar invitaciones por correo
   registrar estado de entrega, apertura o error si se necesita trazabilidad

## Prompt sugerido para continuar manana

Usa este prompt o uno parecido:

```txt
Continua desde el estado actual del proyecto. Antes de hacer cambios, lee docs/session-handoff-2026-04-22.md, README.md y docs/setup.md. Luego sigue con la siguiente prioridad recomendada sin rehacer lo ya implementado.
```
