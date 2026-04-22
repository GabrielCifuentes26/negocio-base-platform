# Escalabilidad futura

## Proximos pasos recomendados

- multi-tenancy real por subdominio o slug con selector de negocio activo
- carga dinamica de branding desde Supabase con cache cliente y fallback offline
- RLS mas estricta por permiso, no solo por `business_id`
- repositorios por modulo con cache, retries y observabilidad
- sincronizacion offline ligera para agenda y ventas
- metricas agregadas con vistas materializadas o jobs
- auditoria de cambios y activity log
- venta detallada con `sale_items` y descuentos o impuestos por linea
- agenda con multiples servicios por cita, bloques y disponibilidad
- seguimiento de entrega, apertura y rebote para invitaciones por correo
- onboarding guiado con horarios, servicios base y branding sugerido por industria
- pruebas automatizadas de UI, hooks y servicios

## Migracion a hosting dinamico

La base funciona como frontend estatico hoy, pero puede migrarse a Vercel sin romper arquitectura:

- quitar `output: "export"` cuando necesites SSR
- mover guards y carga inicial a server components
- usar middleware para auth si el producto lo requiere
- generar enlaces absolutos desde variables de entorno del hosting

## Escalado funcional

Cada modulo puede crecer internamente sin tocar el resto:

- `schemas/` para validacion Zod
- `services/` por repositorio
- `hooks/` por modulo
- `components/` especializadas
- `queries/` si luego incorporas cache o TanStack Query
