# Escalabilidad futura

## Proposito de este documento

Este archivo no es un resumen corto. Su objetivo es dejar una hoja de ruta detallada para continuar el producto sin perder contexto, sin saltar pasos importantes y sin rehacer decisiones ya tomadas.

La base actual ya funciona como plataforma reusable para pequenos negocios, pero aun faltan varias capas para llevarla de "base solida" a "producto mucho mas listo para operar con clientes reales".

Este documento responde tres preguntas:

1. que ya esta suficientemente resuelto
2. que falta realmente
3. en que orden conviene construirlo para no generar deuda tecnica innecesaria

## Donde estamos hoy

La plataforma ya tiene:

- arquitectura modular y reusable
- UI base mobile-first
- auth con Supabase
- multi-negocio con cambio de workspace
- branding configurable
- invitaciones internas con aceptacion real
- onboarding inicial del primer negocio
- roles y permisos base
- modulos principales montados
- GitHub Actions para CI y Pages
- despliegue publico en GitHub Pages

Eso significa que ya no estamos en una etapa de prototipo vacio. La base central existe y funciona. Lo que sigue es endurecer producto, cerrar automatizaciones, ampliar profundidad funcional y preparar crecimiento sin romper la arquitectura.

## Principios para continuar sin degradar la base

Cada cambio futuro deberia respetar estas reglas:

- no hardcodear datos de negocio dentro de componentes
- seguir centralizando configuracion y branding
- mantener separacion entre UI, servicios, validacion, permisos y acceso a datos
- no meter logica compleja directamente en pages o components grandes
- si un modulo crece, dividirlo por `components`, `schemas`, `services`, `hooks` y `types`
- preservar compatibilidad con despliegue estatico mientras no exista una necesidad real de SSR
- si algo requiere hosting dinamico, introducirlo de forma incremental y aislada

## Lo que falta realmente

Lo pendiente se puede dividir en nueve frentes.

### 1. Endurecimiento de seguridad y permisos

Hoy ya hay auth, membresias, roles y permisos base. Sin embargo, todavia hay una parte importante por fortalecer.

#### Estado actual

- el acceso por negocio existe
- hay `business_memberships`
- hay permisos y editor de permisos por rol
- existe estructura inicial de RLS
- el frontend ya filtra modulos y acciones sensibles
- ya existe un catalogo base de permisos por accion
- la UI administrativa ya diferencia lectura versus edicion en users, roles, settings y branding
- existe helper SQL para validar permisos por negocio en capas administrativas

#### Lo que falta

- revisar tabla por tabla si la RLS realmente cubre todos los escenarios
- pasar de una validacion centrada en modulo a una validacion mas fina por accion
- asegurar que las RPC usadas por onboarding, invitaciones o preferencias respeten membresia y rol
- endurecer permisos especiales para editar branding, roles, usuarios y configuracion critica
- revisar que ningun servicio cliente pueda escribir campos que deberian ser de sistema

#### Lo que ya se avanzo en este frente

- existe compatibilidad temporal con claves legacy para no romper instalaciones anteriores de golpe
- branding, settings, roles, role_permissions, memberships e invitaciones ya tienen una capa administrativa mas fina
- la escritura operativa ya puede endurecerse por accion con la migracion correspondiente
- la lectura operativa tambien puede endurecerse por accion en customers, services, products, appointments y sales
- la navegacion ya exige permisos de lectura para dashboard y modulos operativos
- los roles personalizados ya normalizan permisos minimos de lectura cuando se asignan permisos de escritura o gestion
- el siguiente salto natural es revisar RPC sensibles y lecturas cruzadas para evitar combinaciones de permisos que funcionen mal en operaciones complejas

#### Trabajo concreto recomendado

1. construir una matriz real de permisos por accion
   ejemplo: `customers.read`, `customers.create`, `customers.update`, `customers.delete`

2. mapear cada accion a:
   - componente UI
   - servicio frontend
   - politica RLS o RPC

3. revisar las tablas mas sensibles primero:
   - `businesses`
   - `business_memberships`
   - `roles`
   - `role_permissions`
   - `business_invitations`
   - `business_branding`
   - `business_settings`

4. luego revisar modulos operativos:
   - `customers`
   - `services`
   - `products`
   - `appointments`
   - `sales`

5. si una operacion compleja no es segura solo con RLS, moverla a una RPC bien controlada
   ejemplo actual a revisar con cuidado:
   - creacion de citas que necesita leer servicio, cliente y personal
   - listas operativas que combinan datos de varios modulos con permisos potencialmente distintos
   - creacion de ventas cuando el rol tiene ventas pero visibilidad limitada sobre clientes

#### Criterio de cierre

- cada accion sensible tiene permiso explicito
- el frontend oculta o bloquea acciones sin permiso
- la base de datos rechaza intentos directos no autorizados
- documentacion actualizada con la matriz de permisos real

### 2. Subir el nivel de pruebas

Hoy ya hay base de testing con Vitest y algunas pruebas unitarias, pero aun no cubrimos los flujos mas criticos del negocio.

#### Estado actual

- `lint`, `typecheck`, `test` y `build` corren en CI
- existen pruebas unitarias base
- la infraestructura inicial de tests ya esta preparada
- ya existe cobertura para `workspace-preferences`, `workspace-service`, `onboarding-service` e `invitation-service`
- ya existe base de pruebas UI con `jsdom` y `@testing-library/react` para auth y cambio de workspace
- ya existe cobertura especifica para helpers de permisos, navegacion condicionada y normalizacion de dependencias de permisos

#### Lo que falta

- pruebas de hooks criticos
- pruebas de servicios que hablan con Supabase
- pruebas de mapeos de datos por modulo
- pruebas de guards de auth y onboarding
- pruebas del flujo de invitacion
- pruebas del cambio de workspace
- pruebas de formularios criticos

#### Trabajo concreto recomendado

1. ampliar pruebas unitarias de permisos
   - acceso por modulo
   - acceso por accion
   - roles personalizados versus roles de sistema

2. probar `auth-context`
   - carga inicial de sesion
   - usuario sin negocio
   - usuario con varios negocios
   - persistencia de negocio preferido

3. probar onboarding
   - validaciones del formulario
   - mapeo de payload
   - manejo de error de RPC
   - redireccion tras creacion

4. probar invitaciones
   - crear invitacion
   - cancelar invitacion
   - aceptar invitacion con token valido
   - errores por token vencido o correo no coincidente

5. probar servicios de datos por modulo
   - customers
   - services
   - products
   - appointments
   - sales

6. evaluar una segunda capa de pruebas:
   - Testing Library para componentes interactivos
   - Playwright para flujos e2e mas importantes

#### Criterio de cierre

- todos los flujos criticos tienen al menos cobertura unitaria o de integracion
- CI falla si se rompe auth, onboarding, invitaciones o permisos
- existe una pequena estrategia de testing documentada

### 3. Mejorar onboarding del negocio

El onboarding actual ya crea el primer negocio, pero todavia es una version base. Para convertirlo en experiencia de producto comercial, debe guiar mejor la puesta en marcha.

#### Estado actual

- existe `/onboarding`
- crea negocio inicial
- activa estructura base
- redirige cuando el usuario no tiene workspace

#### Lo que falta

- wizard mas completo por pasos
- horarios iniciales
- moneda inicial y formato regional
- modulo activos preseleccionados por industria
- datos de contacto
- branding inicial minimo
- creacion opcional de servicios o categorias sugeridas

#### Trabajo concreto recomendado

1. definir pasos del wizard
   - informacion general del negocio
   - rubro o industria
   - moneda y pais
   - horarios
   - modulos activos
   - branding basico
   - confirmacion final

2. crear presets por industria
   - barberia
   - salon
   - clinica
   - libreria
   - tienda pequena

3. por cada preset definir:
   - nombre sugerido de categorias
   - modulos mas utiles
   - servicios iniciales sugeridos
   - textos de ejemplo

4. extender persistencia
   - horarios
   - configuracion regional
   - plantilla inicial de servicios o productos

5. mostrar resumen final antes de crear

#### Criterio de cierre

- un usuario nuevo puede crear negocio funcional sin tocar SQL manualmente
- la experiencia deja negocio, branding minimo, modulos y configuracion base listos para usar

### 4. Correo real de invitaciones y trazabilidad

La base ya esta preparada para enviar correos con Edge Functions, pero eso aun puede mejorar bastante.

#### Estado actual

- existe funcion `send-business-invitation`
- existe bandera para habilitar correos
- el flujo de invitacion funciona aunque el correo sea opcional

#### Lo que falta

- terminar integracion de proveedor en entorno real
- manejar estado de envio
- registrar errores
- mejorar el contenido del correo
- contemplar reenvio y expiracion visible

#### Trabajo concreto recomendado

1. consolidar variables necesarias del proveedor de correo
2. asegurar manejo consistente de:
   - enviado
   - fallo
   - pendiente
   - reenviado

3. guardar trazabilidad minima en BD
   - fecha de envio
   - ultimo error
   - contador de intentos

4. mejorar UX de invitaciones
   - boton reenviar
   - ver estado
   - mostrar expiracion

5. templating del correo
   - nombre del negocio
   - nombre del rol
   - enlace de aceptacion
   - fecha de vencimiento

#### Criterio de cierre

- las invitaciones pueden enviarse desde la plataforma
- el negocio sabe si se enviaron o fallaron
- el invitado recibe una experiencia clara de acceso

### 5. Profundizar modulos operativos

Los modulos base ya existen, pero varios estan en modo funcional minimo. Si el producto va a crecer como SaaS reusable, conviene ampliar profundidad sin romper la estructura modular.

#### Customers

Falta:

- edicion completa
- historico de actividad
- notas internas
- etiquetas o segmentos
- filtros y busqueda avanzada

#### Services

Falta:

- categorias
- duracion mas rica
- disponibilidad por empleado
- precios variables
- estado activo o inactivo

#### Products

Falta:

- categorias
- stock basico
- alertas de inventario minimo
- costo versus precio
- variantes simples

#### Appointments

Falta:

- multiples servicios por cita
- bloques de tiempo
- reasignacion de empleado
- validacion real de disponibilidad
- estados mas robustos
- vista calendario mas fuerte

#### Sales

Falta:

- lineas de venta detalladas
- descuentos
- impuestos
- metodos de pago
- anulaciones o devoluciones
- relacion directa con citas cuando aplique

#### Reports

Falta:

- filtros por rango de fechas
- comparativas
- exportacion CSV
- eventualmente PDF
- metricas por modulo

#### Trabajo concreto recomendado

Trabajar modulo por modulo y no todos a la vez. El orden sugerido es:

1. appointments
2. sales
3. reports
4. products
5. customers y services con mejoras secundarias

#### Criterio de cierre

- cada modulo clave soporta al menos un caso comercial real sin depender de hojas externas
- la plataforma deja de ser solo base estructural y empieza a resolver operacion diaria

### 6. Auditoria y observabilidad

Cuando el producto crezca, necesitaremos saber quien hizo que cambio, cuando y desde donde vino un error.

#### Lo que falta

- activity log por negocio
- auditoria de acciones administrativas
- logs de errores de procesos criticos
- seguimiento de funciones Edge

#### Trabajo concreto recomendado

1. crear tabla de auditoria o evento
2. registrar acciones de alto impacto
   - cambios de rol
   - cambios de branding
   - cambios de configuracion
   - invitaciones
   - onboarding

3. definir una estrategia ligera de logging
   - consola estructurada en desarrollo
   - eventos persistidos solo para acciones clave

#### Criterio de cierre

- un administrador puede revisar cambios sensibles
- se pueden investigar errores reales sin adivinar

### 7. Mejorar branding y personalizacion

Ya existe configuracion visual centralizada, pero hay espacio para hacerlo mas robusto como sistema de tematizacion.

#### Lo que falta

- favicon configurable
- variantes de logo
- presets de tema
- tipografias mejor controladas
- previsualizacion mas rica
- validaciones de contraste y usabilidad

#### Trabajo concreto recomendado

1. ampliar el formulario de branding
2. soportar favicon y assets complementarios
3. agregar presets visuales
4. calcular variables CSS derivadas
5. validar combinaciones de color problematicas

#### Criterio de cierre

- un negocio puede cambiar identidad visual sin tocar codigo
- la interfaz conserva coherencia y legibilidad

### 8. Preparacion para hosting dinamico y crecimiento SaaS

Hoy la app esta preparada para salida estatica inicial. Eso esta bien para la fase actual. No conviene mover todo a SSR si todavia no hace falta, pero si dejar claro el camino.

#### Lo que falta

- evaluar cuando el producto realmente necesita server rendering
- revisar que partes del auth flow convendria mover a server components o middleware
- pensar tenancy por subdominio o slug publico
- preparar configuracion para entornos mas complejos

#### Camino recomendado

1. mantener estatico mientras:
   - el flujo principal siga resolviendose desde cliente
   - Supabase cubra auth y datos sin friccion

2. migrar a hosting dinamico solo si se necesita:
   - SSR real
   - middleware de auth
   - enlaces firmados o logica sensible en servidor
   - mejor SEO para paginas publicas dinamicas

3. al migrar:
   - quitar `output: "export"`
   - revisar base path
   - aislar servicios que dependan de navegador

#### Criterio de cierre

- existe un plan claro de migracion sin reescribir el producto

### 9. Calidad de producto y operacion

No todo lo pendiente es funcional. Tambien hace falta madurar el proyecto como producto mantenible.

#### Lo que falta

- versionado mas claro de cambios
- checklist de release
- documentacion de despliegue mas operativa
- convenciones para futuras migraciones
- seeds reproducibles por entorno

#### Trabajo concreto recomendado

1. documentar flujo de release
2. crear checklist de antes de desplegar
3. definir como crear negocio demo, usuario demo y datos demo
4. ampliar seeds o scripts de bootstrap

#### Criterio de cierre

- cualquier nueva sesion puede retomar el proyecto sin reconstruir contexto
- el despliegue y mantenimiento dejan de depender de memoria informal

## Orden recomendado para construir lo que falta

No conviene atacar todo a la vez. El orden sugerido es este:

### Fase A. Seguridad y pruebas

Objetivo:

- blindar la base antes de meter mucha mas complejidad funcional

Trabajo:

- matriz de permisos por accion
- revision RLS
- pruebas de auth, onboarding, invitaciones y workspace

Resultado esperado:

- base mas confiable
- menos riesgo de romper algo al crecer

### Fase B. Onboarding y correo de invitaciones

Objetivo:

- mejorar entrada de nuevos negocios y nuevos usuarios

Trabajo:

- wizard enriquecido
- presets por industria
- envio real de invitaciones con trazabilidad

Resultado esperado:

- experiencia inicial mucho mas comercial

### Fase C. Profundizar operacion diaria

Objetivo:

- hacer que la plataforma sirva mejor en uso cotidiano

Trabajo:

- appointments
- sales
- reports
- products

Resultado esperado:

- valor operativo mas claro para clientes reales

### Fase D. Auditoria, observabilidad y calidad operativa

Objetivo:

- preparar el producto para soporte y crecimiento sostenido

Trabajo:

- logs de cambios
- eventos administrativos
- seeds y releases

Resultado esperado:

- mantenimiento menos riesgoso

### Fase E. Evolucion SaaS avanzada

Objetivo:

- preparar crecimiento serio sin romper lo existente

Trabajo:

- tenancy mas avanzado
- evaluacion de SSR
- hosting dinamico cuando ya tenga sentido

Resultado esperado:

- camino claro hacia producto mas maduro

## Tareas concretas sugeridas para la proxima sesion

Si queremos seguir con el mejor equilibrio entre valor y solidez, el siguiente bloque de trabajo deberia ser:

1. ampliar pruebas de:
   - `auth-context`
   - onboarding
   - invitaciones
   - workspace switcher

2. documentar matriz de permisos por accion y alinear RLS con esa matriz

3. revisar si las RPC actuales necesitan endurecimiento adicional

4. despues de eso, enriquecer onboarding y correo

## Riesgos si saltamos pasos

Si metemos mucha funcionalidad nueva antes de cerrar seguridad y pruebas, los riesgos son:

- permisos inconsistentes entre UI y base de datos
- errores silenciosos en onboarding o invitaciones
- crecimiento funcional rapido con deuda estructural
- mas tiempo perdido depurando que construyendo

Si migramos demasiado pronto a SSR o backend propio, los riesgos son:

- complejidad innecesaria
- mas costo operativo
- perder la ventaja de una base simple y reusable

## Archivos y zonas que seguramente volveremos a tocar

Para cualquier trabajo futuro, estas rutas van a seguir siendo muy relevantes:

- `lib/auth/`
- `lib/permissions/`
- `services/api/`
- `modules/auth/`
- `modules/onboarding/`
- `modules/roles/`
- `modules/users/`
- `components/forms/`
- `database/migrations/`
- `supabase/functions/`
- `.github/workflows/`
- `tests/`

## Regla de continuidad para futuras sesiones

Antes de cualquier cambio importante, conviene revisar siempre:

1. `docs/session-handoff-2026-04-22.md`
2. `docs/future-scaling.md`
3. `README.md`
4. `docs/setup.md`

Con eso deberia ser posible retomar sin perder de vista:

- el estado actual
- lo que ya se implemento
- lo que sigue
- el orden correcto para hacerlo
