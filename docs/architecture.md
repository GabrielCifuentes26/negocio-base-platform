# Arquitectura

## Principios

- Producto reusable antes que implementación por cliente.
- Configuración centralizada para datos de negocio y branding.
- Separación estricta entre UI, módulos, datos y utilidades.
- Capa de datos preparada para modo demo estático o Supabase real.
- Diseño mobile-first con expansión progresiva a tablet y desktop.

## Capas

### `app/`

Define rutas con App Router. Se separa en:

- landing pública
- flujo de autenticación
- área protegida tipo plataforma dentro de `app/(platform)`

### `components/`

Contiene UI reutilizable transversal:

- `ui/`: primitives de `shadcn/ui`
- `layout/`: shell, sidebar, topbar
- `shared/`: tablas, tarjetas, page shells, providers y modales genéricos
- `forms/`: formularios reutilizables
- `states/`: vacíos, loaders y estados UX

### `modules/`

Cada dominio funcional vive aislado por módulo. Esto evita mezclar lógica entre clientes, ventas, reservas y configuración. Cada módulo puede crecer con:

- `components/`
- `lib/`
- `services/`
- `schemas/`

### `config/`

Centro de verdad de la personalización:

- datos del producto
- datos del negocio
- módulos activos
- navegación

Aquí vive la mayor parte de la adaptabilidad multi-negocio.

### `lib/`

Utilidades de bajo nivel y código transversal:

- helpers
- permisos
- auth provider
- cliente Supabase
- contexto de sesion y workspace activo

### `services/`

Capa de acceso a datos y mapeo. En esta fase combina modo demo y Supabase real desde frontend sin exigir backend Node.

Incluye servicios por dominio para:

- workspace y configuracion del negocio
- clientes
- servicios
- productos
- reservas
- ventas
- usuarios y equipo
- roles y permisos
- reportes y dashboard

### `types/`

Tipos globales del dominio y contratos compartidos.

### `theme/`

Tokens reutilizables para traducir branding a CSS variables y tema visual.

### `database/`

Esquema SQL, semillas y base para RLS.

## Estrategia multi-negocio

- Ningún componente depende de nombre, logo o moneda hardcodeados.
- `config/business.ts` concentra branding, horarios, textos y contacto.
- `config/modules.ts` controla módulos visibles/activos.
- la base de datos separa negocio, branding, settings y membresías
- el modelo de membresías permite evolucionar a multi-tenant SaaS
- `AuthProvider` carga sesión, perfil, rol y negocio activo desde Supabase
- `ModuleAccessGuard` oculta y bloquea módulos desactivados por negocio
