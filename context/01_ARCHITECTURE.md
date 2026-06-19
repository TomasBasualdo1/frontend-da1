# 01 · Arquitectura

## Capas

```
app/**/*.tsx          Pantallas (Expo Router) — UI + estado local (useState/useEffect)
   │  usan
   ▼
src/context/AuthContext.tsx   Estado global de sesión (token + user)
   │  y llaman a
   ▼
src/services/*.ts     Capa de acceso a API (axios). Una función por endpoint.
   │  via
   ▼
src/services/api.ts   Instancia axios con interceptores (Bearer + 401)
   │  HTTP
   ▼
backend-da1 (FastAPI)
```

Tipos compartidos en `src/types/` (espejo del Swagger). `src/constants/theme.ts` provee design tokens. `src/utils/storage.ts` abstrae el almacenamiento del token.

## Flujo de datos típico (ej. listar subastas)

1. Una pantalla (`app/(tabs)/subastas.tsx`) hace `useEffect(() => auctionService.getSubastas()...)`.
2. `auctionService` (`src/services/auctionService.ts`) llama `api.get("/subastas")`.
3. `api.ts` agrega `Authorization: Bearer <token>` (interceptor, lee SecureStore).
4. La respuesta se tipa con `src/types/auction.ts` y se guarda en `useState`.
5. Si la API responde **401**, el interceptor borra el token; el guard de `_layout.tsx` redirige a login.

## Routing (Expo Router, file-based)

- Carpeta `app/` = rutas. `main` en `package.json` es `expo-router/entry`.
- **Grupos** `(auth)` y `(tabs)`: los paréntesis no aparecen en la URL, solo organizan layouts.
- `_layout.tsx` define el navegador de cada nivel (Stack / NativeTabs).
- Rutas dinámicas: `app/subasta/[id]/index.tsx` → `/subasta/123` (se lee con `useLocalSearchParams`).
- `typedRoutes` está activado (`app.json`) → rutas tipadas.

Detalle de pantallas en [10_NAVIGATION_AND_SCREENS.md](10_NAVIGATION_AND_SCREENS.md).

## Estado / Auth (archivo crítico)

`src/context/AuthContext.tsx` (`AuthProvider` + `useAuth`):
- Estado: `{ isLoading, isAuthenticated, token, user }`.
- Al montar: lee `access_token` de storage; si existe, hace `userService.getProfile()` y marca autenticado.
- `login(data)`: `authService.login` → guarda token → `getProfile` → set estado.
- `logout()`: `authService.logout` (best-effort) → borra token → limpia estado.
- `refreshUser()`: recarga el perfil.

**Guard de navegación** en `app/_layout.tsx` (`RootNavigator`): según `isAuthenticated` y si estás en el grupo `(auth)`, hace `router.replace` a `/(auth)/welcome` o `/(tabs)`. Muestra spinner mientras `isLoading`.

## Capa de servicios (patrón)

- `api.ts`: instancia axios única, `baseURL = EXPO_PUBLIC_API_URL`, timeout 15s, interceptores (request: Bearer; response: maneja 401).
- Un servicio por dominio: `authService`, `userService`, `auctionService`, `articleService`. Re-exportados en `src/services/index.ts`.
- **Normalizers**: `userService` y `articleService` tienen funciones `normalizeXxx` que toleran respuestas en camelCase **y** snake_case del backend. Si el backend cambia nombres, se ajusta ahí.

## Patrones y decisiones detectadas

- **Estilos por `StyleSheet.create` + `theme.ts`**, no NativeWind (aunque NativeWind/Tailwind están configurados). Cada pantalla define su `styles` local y usa `Colors`/`Spacing`/`BorderRadius`. Constantes de UI (labels/colores de categoría) suelen repetirse por pantalla.
- **Sin librería de data-fetching** (no React Query/SWR pese a lo que decía el code-standards viejo). Es `useEffect` + `useState` + try/catch + `Alert`.
- **Token en SecureStore** (nativo) / `localStorage` (web) — abstraído en `storage.ts`.
- **Multipart manual**: en RN los archivos se adjuntan como `{ uri, name, type }`; en web se hace `fetch(uri) → blob`. Ver `articleService`/`authService`/`userService`.
- **NativeTabs** (API `unstable`) para los tabs, con íconos SF Symbols (iOS) + MaterialIcons (Android).
- **Tiempo real (SSE) NO implementado en el cliente**: `live.tsx` no abre EventSource; el cronómetro es un string fijo. Ver [08_PENDING_CONTEXT.md](08_PENDING_CONTEXT.md).

## Archivos críticos

| Archivo | Rol |
|---------|-----|
| `app/_layout.tsx` | AuthProvider + guard de navegación + StatusBar + `global.css`. |
| `src/context/AuthContext.tsx` | Estado de sesión global. |
| `src/services/api.ts` | Axios + interceptores (Bearer / 401). |
| `src/services/index.ts` | Barrel de servicios. |
| `src/types/index.ts` | Barrel de tipos (re-exporta todos). |
| `src/utils/storage.ts` | Token storage cross-platform. |
| `src/constants/theme.ts` | Design tokens. |
| `app.json` | Config Expo (plugins, scheme, typedRoutes, newArch). |
