# context/ — frontend-da1

Documentación contextual de la app móvil del **Sistema de Subastas**. Objetivo: que cualquier desarrollador o IA entienda el repo y trabaje respetando su arquitectura y convenciones **sin redescubrir todo**.

> Repo: `frontend-da1` · App **Expo / React Native (TypeScript)** con **Expo Router**.
> Forma parte de un workspace de 2 repos junto a `backend-da1` (API FastAPI). Ver [11_INTEGRATION.md](11_INTEGRATION.md).

## Orden de lectura recomendado

| # | Archivo | Para qué sirve |
|---|---------|----------------|
| 1 | [00_OVERVIEW.md](00_OVERVIEW.md) | Qué es la app, qué resuelve, stack. |
| 2 | [01_ARCHITECTURE.md](01_ARCHITECTURE.md) | Capas, flujo de datos, estado, archivos críticos, patrones. |
| 3 | [02_SETUP_AND_RUN.md](02_SETUP_AND_RUN.md) | Instalar, correr, variables de entorno. |
| 4 | [10_NAVIGATION_AND_SCREENS.md](10_NAVIGATION_AND_SCREENS.md) | Rutas (Expo Router), pantallas y navegación. |
| 5 | [07_DOMAIN_NOTES.md](07_DOMAIN_NOTES.md) | Dominio: entidades, flujos de negocio, glosario, reglas. |
| 6 | [03_CODE_CONVENTIONS.md](03_CODE_CONVENTIONS.md) | Convenciones reales (estilos, tipos, servicios). |
| 7 | [05_NEW_FILES_GUIDE.md](05_NEW_FILES_GUIDE.md) | Dónde y cómo crear pantallas, servicios, tipos. |
| 8 | [04_AI_WORKFLOW.md](04_AI_WORKFLOW.md) | Cómo debe trabajar una IA: qué leer, qué no asumir, checklist. |
| 9 | [11_INTEGRATION.md](11_INTEGRATION.md) | Cómo consume la API de `backend-da1`. |
| 10 | [06_TESTING_AND_VALIDATION.md](06_TESTING_AND_VALIDATION.md) | Lint, build y validación manual. |
| 11 | [08_PENDING_CONTEXT.md](08_PENDING_CONTEXT.md) | Lo que no se pudo confirmar / riesgos / deuda. |
| 12 | [09_CONTEXT_MAINTENANCE.md](09_CONTEXT_MAINTENANCE.md) | Qué docs viejos había y qué se hizo con ellos. |

## Material de referencia conservado en `context/` (no son docs nuevos)

- **`consignas.md`** — **la consigna oficial del proyecto** (requisitos del TPO de Desarrollo de Aplicaciones I). Fuente de verdad del dominio. La versión completa con entregables está en `backend-da1/context/TPO_DAI_1C2026.md`.
- `Swagger_v4.YAML` — contrato OpenAPI 3.0 de la API (origen de los tipos TS).
- `Estructura-PostgreSQL-da1-updated.sql` — esquema de la base (la administra el backend).
- `progress-tracker.md` — avance por spec (estado de implementación front/back).
- `specs/` — specs SDD numeradas (01–12) que guiaron el desarrollo.

> **Regla de oro:** si algo no se confirma leyendo el código o estas fuentes, está marcado `PENDIENTE DE CONFIRMAR` en [08_PENDING_CONTEXT.md](08_PENDING_CONTEXT.md). No inventar endpoints, props ni rutas.
