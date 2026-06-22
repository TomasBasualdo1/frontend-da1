# 11 · Integración con `backend-da1`

Vista desde el **frontend**. (Contraparte: `backend-da1/context/12_INTEGRATION.md`.)

## Relación

- Esta app consume la API REST de `backend-da1` con **JWT Bearer**.
- Son **dos repos git independientes** abiertos juntos en el workspace VS Code (**no monorepo**): no comparten dependencias ni build.
- **Contrato compartido**: `Swagger_v4.YAML` (copia en `context/`), del cual derivan los tipos de `src/types/` (lado front) y los Pydantic del backend.
- El esquema SQL `Estructura-PostgreSQL-da1-updated.sql` (copia en `context/`) lo administra el backend; el front no toca la base directamente.

## Cómo se conecta

- `src/services/api.ts`: axios con `baseURL = process.env.EXPO_PUBLIC_API_URL` (fallback `http://localhost:8000`), timeout 15s.
- **Request interceptor**: agrega `Authorization: Bearer <token>` leyendo `access_token` de `src/utils/storage.ts`.
- **Response interceptor**: ante **401** borra el token; el guard de `app/_layout.tsx` lleva a login.
- Token guardado en SecureStore (nativo) / localStorage (web).

## Servicios y endpoints que consumen

| Servicio (`src/services/`) | Endpoints `backend-da1` |
|----------------------------|--------------------------|
| `authService.ts` | `POST /auth/registro/paso1` (multipart), `/paso2`, `/login`, `/logout`, `/forgot-password`, `/reset-password`, `GET /paises` |
| `userService.ts` | `GET/PATCH /usuarios/me`, `DELETE /usuarios/me/foto`, `*/medios-pago*`, `/metricas`, `/multas`, `/multas/pagar`, `/notificaciones*` |
| `auctionService.ts` | `GET /subastas[/publicas][/{id}]`, `POST/DELETE /subastas/{id}/join`, `/historial`, `/items/{itemId}/pujar`, `/pagos`, `POST /admin/subastas`, `/admin/subastas/{id}/catalogo/items` |
| `articleService.ts` | `POST /articulos` (multipart), `GET /articulos/mis-publicaciones`, `GET /articulos/{id}`, `/aceptar-tasacion`, `/seguro/aumentar` |

> Referencia completa de rutas: `backend-da1/context/10_API_REFERENCE.md`.

## Detalles del contrato que importan

- **Multipart**: registro paso 1, update perfil y publicar artículo arman `FormData`. En RN los archivos van como `{ uri, name, type }`; en **web** se hace `fetch(uri) → blob`. Los nombres de campo deben coincidir con el backend (`fotoFrente`, `fotoDorso`, `fotos`, `documentacionOrigen`).
- **Normalización defensiva**: `normalizeUsuario`, `normalizeArticulo`, `normalizeMedioPago`, etc. aceptan camelCase **y** snake_case porque el backend no es 100% consistente. Si agregás campos, extendé el normalizer correspondiente.
- **Códigos manejados en UI**: 401 (sesión, global), 403 (acceso/categoría), 409 (ya conectado a otra subasta). Mantenerlos alineados con el backend.
- **Pujas**: `auctionService.pujar` manda header `Idempotency-Key` y el backend deduplica reintentos. Si la garantía limitada no alcanza, el backend responde `400` con `detail.codigo = "GARANTIA_INSUFICIENTE"` y datos seguros (`garantiaDisponible`, `exposicionActual`, `importeRequerido`, `moneda`).

## Desalineaciones conocidas (importante)

1. **Garantía disponible no anticipada**: no existe endpoint frontend para consultar exposición acumulada antes de pujar. `live.tsx` muestra el rechazo backend de garantía insuficiente, pero no deshabilita botones por exposición acumulada.
2. **Admin sin UI**: `auctionService.createSubasta/addCatalogItem` apuntan a `/admin/*`, pero no hay pantalla admin. Además el backend protege mal esos endpoints (solo `evaluar artículo` chequea admin).
3. **`StreamEvent` tipo**: `src/types/common.ts` define `type: 'puja' | 'item'`, pero el backend emite `'puja'` y `'cierre'`. Ajustar al integrar SSE.

> Al cambiar el contrato (rutas/payloads/nombres), **actualizá ambos repos + el Swagger**. Revisá los normalizers de `src/services/` si cambian nombres de campos.
