# 03 · Convenciones de código

Basadas en el código **real**. Para escribir código nuevo, imitá una pantalla/servicio existente del mismo tipo.

> ⚠ El `code-standards.md` heredado (archivado en `_legacy/`) decía "usar NativeWind" y "React Query/SWR". **El código real no los usa.** Esta guía refleja la práctica actual; ante conflicto, gana el código.

## Idioma

- **Dominio en español**: tipos y conceptos (`Subasta`, `Articulo`, `Puja`, `MedioPago`), textos de UI y mensajes.
- **Infra en inglés**: nombres de funciones de servicio (`getSubastas`, `pujar`), hooks (`useAuth`), utilidades.
- Comentarios JSDoc cortos en español sobre cada método de servicio (estilo existente).

## Componentes y pantallas

- **Functional components + hooks**. Export `default function NombreScreen()`.
- Estado con `useState`; efectos con `useEffect`; navegación con `useRouter()` / `useLocalSearchParams()`.
- Una pantalla = un archivo en `app/`. El nombre del archivo define la ruta (Expo Router).
- Datos del backend: cargar en `useEffect`, manejar errores con try/catch + `Alert.alert(...)`.
- Acceso a sesión: `const { user, isAuthenticated, login, logout } = useAuth()`.

## Estilos

- **`StyleSheet.create`** al final del archivo (`const styles = StyleSheet.create({...})`).
- Colores/espaciados desde `src/constants/theme.ts` (`Colors`, `Spacing`, `BorderRadius`, `Fonts`).
- Patrón repetido: mapas locales `CATEG_LABELS` / `CATEG_COLORS` por pantalla para badges de categoría. (Hay duplicación; si la unificás, hacelo en un lugar compartido.)
- NativeWind/`className` existe pero es marginal — no introducir un estilo mixto sin acordarlo.

## Servicios (`src/services/`)

- Un objeto por dominio: `export const xxxService = { async metodo() {...} }`.
- Toda llamada pasa por `api` (axios) de `api.ts` (no usar `fetch` salvo para convertir `uri → blob` en uploads web).
- Tipar request y response con los tipos de `src/types/`.
- Respuestas potencialmente inconsistentes (camel/snake) → usar/extender un `normalizeXxx`.
- Re-exportar el servicio nuevo en `src/services/index.ts`.

## Tipos (`src/types/`)

- Un archivo por dominio (`auth.ts`, `user.ts`, `auction.ts`, `article.ts`, `payment.ts`, `common.ts`), re-exportados en `index.ts`.
- **Deben reflejar el Swagger** (`context/Swagger_v4.YAML`) y los modelos Pydantic del backend.
- Enums como uniones de strings (`type Categoria = 'comun' | ... | 'platino'`).
- Importar desde el barrel: `import { Usuario, SubastaListado } from '../types'`.

## Imports

- Alias `@/*` disponible (→ raíz), aunque las pantallas usan rutas relativas (`../../src/...`). Mantené el estilo del archivo que tocás.
- Orden habitual: React/RN → libs Expo/navegación → `src/context` → `src/services` → `src/types`.

## Manejo de errores HTTP en UI

Patrón visto (ej. `live.tsx`): leer `e?.response?.status` y reaccionar:
- 401 → sesión (lo maneja el interceptor global).
- 403 → "no cumplís los requisitos".
- 409 → "ya estás conectado a otra subasta".
Mantené estos mensajes coherentes con los códigos del backend.

## TypeScript

- `strict: true`. Evitá `any`; donde el backend es ambiguo, usá `unknown` + normalizer (como ya se hace).
- Tipá los `useState<...>` con los tipos de dominio.
