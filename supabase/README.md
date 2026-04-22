# Supabase

Este directorio agrupa artefactos relacionados con Supabase para la evolucion del producto:

- `database/migrations/`: esquema SQL inicial y funciones RPC.
- `database/seeds/`: datos base de permisos.
- `lib/supabase/`: clientes y utilidades para conexion desde frontend.
- `functions/`: funciones edge listas para automatizaciones.

Incluye actualmente:

- `functions/send-business-invitation/index.ts`: envio opcional de invitaciones por correo usando Resend.

En una siguiente fase puedes anadir:

- `supabase/config.toml`
- policies RLS adicionales
- scripts de generacion de tipos
- mas funciones edge para recordatorios, reportes o webhooks
