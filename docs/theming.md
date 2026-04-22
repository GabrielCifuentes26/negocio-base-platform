# Theming

## Fuente de verdad

La tematización parte desde `config/business.ts`.

Se puede cambiar desde un solo lugar:

- nombre del negocio
- colores
- tipografía
- logo
- imágenes
- textos
- contacto
- moneda
- horarios

## Flujo

1. `config/business.ts` define branding.
2. `hooks/use-branding.ts` traduce branding a variables CSS.
3. `components/shared/app-providers.tsx` inyecta esas variables.
4. `app/globals.css` consume variables para tema visual.

## Recomendación SaaS

Cuando pases a multi-tenant real:

- mueve branding a base de datos
- hidrata la configuración al iniciar sesión
- conserva `config/business.ts` como fallback local o preset demo
