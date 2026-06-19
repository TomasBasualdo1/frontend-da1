# 08 · Pending Context

Cosas **no confirmables** solo leyendo el repo, riesgos y deuda del frontend.

## PENDIENTE DE CONFIRMAR

- **`AuthContext` duplicado**: existe `src/context/AuthContext.tsx` (el que importa `app/_layout.tsx`) y aparece otra copia más vieja en el árbol de `src/context/` (versión de mayo). Confirmar cuál es la fuente de verdad y **eliminar el duplicado** para evitar editar el equivocado.
- **`src/context/specs/`**: carpeta vacía dentro de `src/context/`. ¿Sobrante? Las specs reales están en `context/specs/`.
- **Script `reset-project`**: `package.json` referencia `./scripts/reset-project.js`, pero `scripts/` **no existe**. El script no corre.
- **`@sendgrid/mail` en dependencias del front**: librería de servidor (envío de emails) listada en `package.json`. PENDIENTE confirmar si se usa o es dependencia colada (el envío de emails es responsabilidad del backend; no debería usarse desde la app).
- **`eas.json` no versionado**: el equipo buildea con EAS (perfiles development/preview/production, ver [02_SETUP_AND_RUN.md](02_SETUP_AND_RUN.md)) pero el `eas.json` **no está en el repo** (vive en Notion). Conviene agregarlo al repo para builds reproducibles. (`EXPO_PUBLIC_API_URL` resuelto: prod = `https://backend-da1.onrender.com`.)
- **Cronómetro de subasta**: `live.tsx` muestra `"31:59"` fijo. ¿De dónde debería salir el tiempo restante real? (No hay campo de duración/fin en el contrato actual.)
- **Pantalla de administración**: hay métodos `createSubasta`/`addCatalogItem` en `auctionService` sin UI. ¿Se planea una pantalla admin o se opera por fuera de la app?

## Tareas pendientes conocidas del equipo (de Notion)

Backlog confirmado por el equipo (estado al momento de documentar):

**Pendientes:**
- [ ] **Carga de subastas / hacer subasta**: no hay UI para crear subastas ni cargar catálogo (los métodos `auctionService.createSubasta`/`addCatalogItem` existen, sin pantalla).
- [ ] **Creación de artículo (`consignar.tsx`)**:
  - `fechaCreacion` debe ser **un date picker / fecha válida** (hoy es texto libre).
  - "Valor estimado" debe aceptar **solo números** (hoy texto libre).
- [ ] **Textos blancos ilegibles** en algún formulario de register/login al enviar (parcialmente arreglado; queda alguna pantalla con el bug — identificar cuál).
- [ ] **Botones de login/register poco tolerantes al toque**: agrandar el área táctil; en pruebas, toques imprecisos no registraban. Mejorar affordance de los inputs/botones.
- [ ] **Rediseñar UI de Perfil**: hoy es confusa. Objetivo: avatar + nombre + categoría arriba, y debajo una lista *touchable* de opciones (Mis subastas, Modificar datos, Cerrar sesión).
- [ ] **Registro desacoplado** (impacta back; el front debe reflejar el nuevo flujo de "solicitud pendiente de aprobación" en vez de entrar directo). Ver `backend-da1/context/08_PENDING_CONTEXT.md`.

**Ya resueltos** (de la misma lista, para no rehacerlos): feedback al iniciar sesión; medios de pago movidos a después de setear password / CRUD desde perfil; perfil ya muestra datos + avatar + edición; saludo "Hola, &lt;nombre&gt;"; campo país en register; recuperar contraseña; seed de subastas demo (imágenes/nombres mejorables); medio de pago sacado del cambio de password.

## Riesgos / deuda técnica

1. **Tiempo real ausente**: `live.tsx` no consume SSE (`/subastas/{id}/stream`). Las pujas de otros usuarios no se ven sin recargar. RN no trae `EventSource`; integrar requiere polyfill o fetch-stream. Es la deuda funcional más grande del front.
2. **`StreamEvent` desalineado**: `src/types/common.ts` define `type: 'puja' | 'item'`, pero el backend emite `'puja'` y `'cierre'`. Corregir al integrar SSE.
3. **Estilos**: NativeWind/Tailwind están configurados (babel, metro, `tailwind.config.js`, `global.css`) pero casi no se usan; las pantallas son `StyleSheet`. Mantener dos sistemas configurados confunde. Decidir uno.
4. **Duplicación de constantes de UI**: `CATEG_LABELS`/`CATEG_COLORS` se repiten en varias pantallas en vez de centralizarse (podrían vivir en `theme.ts`/un util).
5. **Manejo de errores básico**: `Alert.alert` genérico; sin estados de error/empty/loading unificados ni reintentos.
6. **Sin tests**: cualquier regresión se detecta solo manualmente.
7. **`Idempotency-Key`**: el front la envía pero el backend la ignora; doble-tap de puja podría duplicar.

## Info útil para pedirle al equipo

- Valor correcto de `EXPO_PUBLIC_API_URL` para cada entorno.
- ¿Se quiere SSE en vivo ya, o el flujo actual (carga puntual) es aceptable para la entrega?
- ¿Habrá rol/pantalla de administrador en la app?
- ¿Se elimina NativeWind o se migra a él? (afecta convención de estilos)

## Deudas de documentación

- `DOCUMENTATION.md` (raíz) es previo; puede divergir del código actual. Ante conflicto, **gana el código**; esta carpeta `context/` prioriza lo verificado.
- `progress-tracker.md` marca varios specs de backend como `[ ]` aunque el backend ya implementó endpoints (ej. join, pujas, cierre): el tracker está **desactualizado** respecto del estado real del backend. Útil como historia, no como verdad actual.
