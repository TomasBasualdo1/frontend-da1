# 09 · Context Maintenance

Registro de qué documentación previa existía en `context/` y qué se hizo con ella al construir esta estructura.

## Documentación encontrada (antes)

| Elemento | Contenido | Decisión |
|----------|-----------|----------|
| `project-overview.md` | Resumen SDD corto con `[cite: N]` de la consigna | **Archivado** en `_legacy/` — absorbido y ampliado en [00_OVERVIEW.md](00_OVERVIEW.md) / [07_DOMAIN_NOTES.md](07_DOMAIN_NOTES.md) |
| `architecture-context.md` | Stack + patrones, mezclaba front y back | **Archivado** en `_legacy/` — reescrito en [01_ARCHITECTURE.md](01_ARCHITECTURE.md) |
| `code-standards.md` | Estándares (decía NativeWind + React Query) | **Archivado** en `_legacy/` — corregido en [03_CODE_CONVENTIONS.md](03_CODE_CONVENTIONS.md) (el código real **no** usa NativeWind ni React Query) |
| `ai-workflow-rules.md` | 5 reglas SDD breves | **Archivado** en `_legacy/` — ampliado en [04_AI_WORKFLOW.md](04_AI_WORKFLOW.md) |
| `consignas.md` | **Consigna oficial del proyecto** (requisitos) | **Conservado** tal cual — fuente de verdad del dominio |
| `Swagger_v4.YAML` | Contrato OpenAPI 3.0 | **Conservado** — fuente de verdad de la API |
| `Estructura-PostgreSQL-da1-updated.sql` | Esquema de la base | **Conservado** — referencia (lo administra el backend) |
| `progress-tracker.md` | Avance por spec | **Conservado** — útil como historia (⚠ desactualizado vs backend; ver [08_PENDING_CONTEXT.md](08_PENDING_CONTEXT.md)) |
| `specs/` (01–12) | Specs SDD numeradas | **Conservado** — historia de implementación |

## Decisiones tomadas

1. **Stubs SDD genéricos → `context/_legacy/`.** Los 4 archivos (`project-overview`, `architecture-context`, `code-standards`, `ai-workflow-rules`) eran cortos, mezclaban front/back y tenían info desactualizada (NativeWind/React Query). Su contenido válido se integró en los nuevos archivos numerados; los originales quedan en `_legacy/` por trazabilidad.
2. **Material de valor conservado en su lugar**: `consignas.md`, `Swagger_v4.YAML`, el `.sql`, `progress-tracker.md` y `specs/` **no se tocaron**. Son fuentes de verdad o historia útil; los docs nuevos los enlazan en vez de duplicarlos.
3. **Nada se borró sin integrarlo antes.** No se eliminó información; lo redundante se archivó.
4. **Corrección importante de contenido**: se documentó la realidad (StyleSheet+theme, sin React Query, SSE no integrado) en lugar de repetir lo que decían los stubs viejos.

## Estructura resultante de `context/`

```
context/
├── README.md                  # índice + orden de lectura
├── 00_OVERVIEW.md
├── 01_ARCHITECTURE.md
├── 02_SETUP_AND_RUN.md
├── 03_CODE_CONVENTIONS.md
├── 04_AI_WORKFLOW.md
├── 05_NEW_FILES_GUIDE.md
├── 06_TESTING_AND_VALIDATION.md
├── 07_DOMAIN_NOTES.md
├── 08_PENDING_CONTEXT.md
├── 09_CONTEXT_MAINTENANCE.md   # este archivo
├── 10_NAVIGATION_AND_SCREENS.md
├── 11_INTEGRATION.md           # relación con backend-da1
├── consignas.md                # (conservado) consigna oficial
├── Swagger_v4.YAML             # (conservado) contrato API
├── Estructura-PostgreSQL-da1-updated.sql  # (conservado) esquema BD
├── progress-tracker.md         # (conservado) avance por spec
├── specs/                      # (conservado) specs SDD 01–12
└── _legacy/                    # stubs SDD viejos archivados
```

## Cómo mantener esta carpeta

- Nueva pantalla/ruta → actualizar [10_NAVIGATION_AND_SCREENS.md](10_NAVIGATION_AND_SCREENS.md).
- Nuevo endpoint consumido → [11_INTEGRATION.md](11_INTEGRATION.md) (y revisar el Swagger).
- Cambio de convención (ej. migrar a NativeWind) → [03_CODE_CONVENTIONS.md](03_CODE_CONVENTIONS.md).
- Pendiente resuelto → moverlo de [08_PENDING_CONTEXT.md](08_PENDING_CONTEXT.md) a su doc.
- `_legacy/` puede borrarse cuando el equipo confirme que no necesita su trazabilidad.
