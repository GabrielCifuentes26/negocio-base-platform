# Estructura de carpetas

```txt
app/
components/
modules/
lib/
hooks/
services/
types/
config/
theme/
styles/
public/
supabase/
database/
docs/
```

## Convenciones

- Archivos React: `kebab-case.tsx`
- Componentes exportados: `PascalCase`
- Hooks: `use-*.ts`
- Tipos globales: `types/*.ts`
- Configuración central: `config/*.ts`
- Módulos funcionales: `modules/<dominio>/`

## Regla práctica

Si una pieza solo sirve a un dominio, va dentro de `modules/`. Si sirve a toda la plataforma, va en `components/`, `lib/`, `services/` o `types/`.
