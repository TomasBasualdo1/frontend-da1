# 10 · Navegación y Pantallas

Routing con **Expo Router v6** (file-based). Carpeta `app/` = mapa de rutas. Grupos `(auth)` y `(tabs)` agrupan layouts sin aparecer en la URL.

## Árbol de navegación

```
app/_layout.tsx                 Root Stack + AuthProvider + guard de redirección
├── (auth)/_layout.tsx          Stack (animación slide_from_right), headerShown:false
│   ├── welcome.tsx             Landing / entrada
│   ├── login.tsx               Login (documento + password)
│   ├── register-step1.tsx      Registro paso 1 (datos + fotos DNI, multipart)
│   ├── register-step2.tsx      Registro paso 2 (token + password + medio de pago)
│   ├── forgot-password.tsx     Solicitar reset
│   └── reset-password.tsx      Confirmar reset con token
├── (tabs)/_layout.tsx          NativeTabs (4 tabs)
│   ├── index.tsx               "Inicio" — home / listado destacado de subastas
│   ├── live.tsx                "En Vivo" — unirse y pujar en subasta abierta
│   ├── subastas.tsx            "Subastas" — listado con búsqueda/filtros
│   └── profile.tsx             "Perfil" — datos, medios de pago, métricas, multas, notificaciones
├── subasta/
│   ├── _layout.tsx             Stack (headerShown:false)
│   └── [id]/index.tsx          Detalle de subasta (catálogo). Ruta: /subasta/:id
└── consignar.tsx               Wizard de consignación de artículos (multi-paso)
```

## Guard de autenticación

En `app/_layout.tsx` (`RootNavigator`), con `useAuth()` + `useSegments()`:
- Si **no** autenticado y **no** estás en `(auth)` → `router.replace("/(auth)/welcome")`.
- Si autenticado y estás en `(auth)` → `router.replace("/(tabs)")`.
- Mientras `isLoading` → spinner (no renderiza navegación).

## Tabs (NativeTabs)

`app/(tabs)/_layout.tsx` usa `expo-router/unstable-native-tabs`. 4 triggers con `Label` + `Icon` (SF Symbols en iOS, MaterialIcons en Android):

| name | Label | Ícono iOS / Android |
|------|-------|----------------------|
| `index` | Inicio | `house.fill` / `home-filled` |
| `live` | En Vivo | `dot.radiowaves...` / `cell-tower` |
| `subastas` | Subastas | `hammer.fill` / `gavel` |
| `profile` | Perfil | `person.crop.circle` / `person-outline` |

## Pantallas — responsabilidad y servicios que usan

| Pantalla | Hace | Llama |
|----------|------|-------|
| `(auth)/welcome` | Entrada, links a login/registro | — |
| `(auth)/login` | Autenticar | `useAuth().login` → `authService.login` |
| `(auth)/register-step1` | Datos + fotos DNI (image-picker, multipart) | `authService.registroPaso1`, `getPaises` |
| `(auth)/register-step2` | Password + medio de pago con token | `authService.registroPaso2` |
| `(auth)/forgot-password` | Pide email | `authService.forgotPassword` |
| `(auth)/reset-password` | Token + nueva password | `authService.resetPassword` |
| `(tabs)/index` | Home: subastas destacadas | `auctionService.getSubastas` |
| `(tabs)/live` | Unirse + pujar (botones +1/5/10/20% e input) | `auctionService.join/getDetalle/getHistorial/pujar/leave` |
| `(tabs)/subastas` | Listado con búsqueda y filtros por categoría | `auctionService.getSubastas` |
| `(tabs)/profile` | Perfil, medios de pago, métricas, multas, notificaciones; editar/foto | `userService.*`, `auctionService.*` |
| `subasta/[id]` | Detalle + catálogo de una subasta | `auctionService.getDetalle / getPublicaDetalle` |
| `consignar` | Wizard publicar artículo (fotos, declaraciones) | `articleService.publicar` |

## Navegar entre pantallas

```tsx
import { useRouter } from "expo-router";
const router = useRouter();
router.push("/subasta/123");          // a detalle dinámico
router.replace("/(tabs)");            // reemplazar (post-login)
// leer params en [id]:
import { useLocalSearchParams } from "expo-router";
const { id } = useLocalSearchParams();
```

## Notas

- `live.tsx` **no** recibe eventos SSE; muestra estado puntual y un cronómetro fijo (`"31:59"`). La actualización en tiempo real es deuda pendiente — ver [11_INTEGRATION.md](11_INTEGRATION.md) y [08_PENDING_CONTEXT.md](08_PENDING_CONTEXT.md).
- No se detectó pantalla de **administración** (crear subasta / cargar catálogo), aunque `auctionService` tiene los métodos `createSubasta`/`addCatalogItem`.
