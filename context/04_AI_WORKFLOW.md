# 04 · AI Workflow

Cómo debe trabajar una IA (o dev nuevo) en este repo **antes de tocar código**.

## 1. Cargar contexto (en este orden)

1. [00_OVERVIEW.md](00_OVERVIEW.md) y [01_ARCHITECTURE.md](01_ARCHITECTURE.md) — modelo mental.
2. [10_NAVIGATION_AND_SCREENS.md](10_NAVIGATION_AND_SCREENS.md) — mapa de rutas/pantallas.
3. [03_CODE_CONVENTIONS.md](03_CODE_CONVENTIONS.md) — convenciones reales (¡NativeWind NO se usa!).
4. [11_INTEGRATION.md](11_INTEGRATION.md) + `context/Swagger_v4.YAML` — contrato con el backend.
5. La **pantalla/servicio vecino** del que vas a tocar (imitar estilo).

## 2. Qué leer según el tipo de tarea

| Tarea | Leé primero |
|-------|-------------|
| Nueva pantalla | una pantalla similar en `app/` + su layout + [05_NEW_FILES_GUIDE.md](05_NEW_FILES_GUIDE.md) |
| Consumir un endpoint nuevo | el `src/services/*Service.ts` del dominio + `src/types/` + Swagger |
| Cambiar navegación | `app/_layout.tsx`, el `_layout.tsx` del grupo, [10_NAVIGATION_AND_SCREENS.md](10_NAVIGATION_AND_SCREENS.md) |
| Auth / sesión | `src/context/AuthContext.tsx`, `src/services/api.ts`, `src/utils/storage.ts` |
| Estilos / tema | `src/constants/theme.ts` + `StyleSheet` de la pantalla vecina |
| Tipos | `src/types/*` (espejo del Swagger) |
| Pujas en vivo | `app/(tabs)/live.tsx`, `auctionService` |
| Consignación | `app/consignar.tsx`, `articleService` |

## 3. Cómo investigar una feature

1. Encontrá la pantalla en `app/` (la ruta = el path del archivo).
2. Mirá qué servicio(s) de `src/services/` usa y a qué endpoint(s) pega.
3. Cruzá con `src/types/` (contrato) y el Swagger.
4. Verificá si el backend ya implementa lo que necesitás (`backend-da1/context/10_API_REFERENCE.md`).

## 4. No asumir (verificar en código)

- **No es NativeWind**: las pantallas usan `StyleSheet.create` + `theme.ts`. No metas `className` masivo.
- **No hay React Query/SWR**: es `useEffect` + `useState` + `Alert`. No introduzcas una librería de fetching sin acordarlo.
- **Nombres de campos**: el backend mezcla camel/snake; el front normaliza en los servicios. No asumas el shape crudo de la respuesta.
- **Endpoints existentes**: confirmá en Swagger / API Reference del backend; no inventes rutas.
- **SSE no está integrado**: no asumas tiempo real en `live.tsx`.
- **`src/context/` tiene un AuthContext duplicado/viejo**: el activo es el importado en `app/_layout.tsx` (`src/context/AuthContext.tsx`). No edites el equivocado.

## 5. No romper arquitectura

- Pantalla → servicio → `api.ts`. No uses `axios`/`fetch` sueltos en pantallas (salvo `fetch` para `uri→blob` en uploads web, patrón ya existente).
- Tipá todo con `src/types/`; si falta un tipo, agregalo ahí (espejando el Swagger), no inline.
- Registrá servicios nuevos en `src/services/index.ts`.
- Respetá el guard de navegación de `_layout.tsx` (no dupliques lógica de auth en pantallas).

## 6. Checklist previo a cualquier cambio

- [ ] ¿Identifiqué la pantalla/servicio correctos?
- [ ] ¿Hay un patrón equivalente para copiar?
- [ ] ¿El endpoint existe en el backend (Swagger/API Reference)? ¿Respeto el payload?
- [ ] ¿Usé tipos de `src/types/` y el normalizer si la respuesta es ambigua?
- [ ] ¿Estilo con `StyleSheet` + `theme.ts` (no NativeWind)?
- [ ] ¿Manejo de errores con try/catch + `Alert` y los códigos (401/403/409)?
- [ ] ¿`npm run lint` sin errores nuevos? ¿Compila TS (strict)?
- [ ] ¿Afecta el contrato? ¿Hay que ajustar `backend-da1`?
- [ ] ¿Actualicé `context/progress-tracker.md` si la feature tenía spec?

## 7. SDD heredado

El proyecto usó **Spec-Driven Development**: specs en `context/specs/` (01–12) y `context/progress-tracker.md`. Para features grandes, mirá si hay spec y mantené el tracker. No es obligatorio para fixes chicos.
