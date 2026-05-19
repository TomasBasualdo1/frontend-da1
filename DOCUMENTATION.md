# frontend-da1 — Documentación del Frontend

Aplicación móvil **SubastApp** construida con **Expo (React Native)** para la plataforma de subastas. Conecta con el backend API en `backend-da1.onrender.com`.

---

## Tabla de Contenidos

- [Tech Stack](#tech-stack)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Arquitectura](#arquitectura)
- [Routing (Expo Router)](#routing-expo-router)
- [Pantallas y Componentes](#pantallas-y-componentes)
- [Servicios API](#servicios-api)
- [Tipos TypeScript](#tipos-typescript)
- [Estado Global (AuthContext)](#estado-global-authcontext)
- [Diseño y Tema](#diseño-y-tema)
- [Configuración](#configuración)
- [Cómo ejecutar](#cómo-ejecutar)

---

## Tech Stack

| Categoría           | Tecnología                                           |
| ------------------- | ---------------------------------------------------- |
| Framework           | React Native 0.81.5 + Expo SDK 54                    |
| Lenguaje            | TypeScript 5.9.2                                     |
| Routing             | Expo Router v6 (file-based)                          |
| Estilos             | NativeWind v4 (Tailwind para RN) + StyleSheet.create |
| Estado              | React Context (AuthContext) + useState                |
| HTTP Client         | Axios 1.16 con interceptores                         |
| Almacenamiento      | expo-secure-store (nativo) + localStorage (web)      |
| Iconos              | @expo/vector-icons (MaterialIcons)                   |
| Animaciones         | react-native-reanimated v4 + react-native-gesture-handler |
| Linting             | ESLint con eslint-config-expo                        |

---

## Estructura del Proyecto

```
frontend-da1/
├── app.json                        # Configuración Expo
├── package.json                    # Dependencias
├── tsconfig.json                   # TypeScript strict, path alias @/*
├── babel.config.js                 # Babel + NativeWind
├── metro.config.js                 # Metro bundler + NativeWind
├── tailwind.config.js              # Tema personalizado (crema/dorado)
├── global.css                      # Directivas Tailwind
├── eslint.config.js                # ESLint flat config
│
├── app/                            # Ruteo basado en archivos (Expo Router)
│   ├── _layout.tsx                 # Layout raíz (AuthProvider + Stack)
│   │
│   ├── (auth)/                     # Grupo de rutas sin autenticación
│   │   ├── _layout.tsx             # Auth stack layout
│   │   ├── welcome.tsx             # Pantalla de bienvenida
│   │   ├── login.tsx               # Login (documento + password)
│   │   ├── register-step1.tsx      # Registro paso 1 (datos personales + fotos DNI)
│   │   ├── register-step2.tsx      # Registro paso 2 (token + password)
│   │   └── forgot-password.tsx     # Recuperación de contraseña
│   │
│   ├── (tabs)/                     # Grupo de rutas con tabs (app principal)
│   │   ├── _layout.tsx             # Bottom tab layout (4 tabs)
│   │   ├── index.tsx               # Home — subastas destacadas y próximas
│   │   ├── live.tsx                # Subastas en vivo con bidding
│   │   ├── subastas.tsx            # Listado de subastas con búsqueda/filtros
│   │   └── profile.tsx             # Perfil con 4 sub-tabs
│   │
│   ├── consignar.tsx               # Wizard de 4 pasos para publicar artículo
│   │
│   └── subasta/                    # Grupo de detalle de subasta
│       ├── _layout.tsx             # Stack layout sin header
│       └── [id]/
│           └── index.tsx           # Detalle de subasta (catálogo + join)
│
├── src/                            # Lógica de negocio
│   ├── constants/
│   │   └── theme.ts                # Tokens de diseño: colores, fuentes, spacing
│   │
│   ├── context/
│   │   └── AuthContext.tsx          # Contexto de autenticación global
│   │
│   ├── services/
│   │   ├── index.ts                # Re-exporta todos los servicios
│   │   ├── api.ts                  # Instancia Axios con interceptores
│   │   ├── authService.ts          # Endpoints de autenticación
│   │   ├── auctionService.ts       # Endpoints de subastas
│   │   ├── articleService.ts       # Endpoints de artículos
│   │   └── userService.ts          # Endpoints de usuario
│   │
│   ├── types/
│   │   ├── index.ts                # Re-exporta todos los tipos
│   │   ├── common.ts               # Categoria, Moneda, Notificacion, etc.
│   │   ├── auth.ts                 # LoginRequest, TokenResponse, RegistroPaso1/2
│   │   ├── user.ts                 # Usuario, UsuarioUpdate, UsuarioMetricas
│   │   ├── payment.ts              # MedioPago, Multa
│   │   ├── auction.ts              # SubastaListado, SubastaDetalle, ItemCatalogo, Puja
│   │   └── article.ts              # Articulo, ArticuloInput
│   │
│   └── utils/
│       └── storage.ts              # Wrapper de SecureStore (nativo + web fallback)
│
├── assets/images/                  # Iconos, splash, logo
│
├── context/                        # Documentación interna y especificaciones
│   ├── project-overview.md
│   ├── architecture-context.md
│   ├── code-standards.md
│   ├── ai-workflow-rules.md
│   ├── consignas.txt
│   ├── progress-tracker.md
│   └── specs/                      # 11 specs de funcionalidades
│       ├── auth-login.md
│       ├── auth-setup.md
│       ├── cierre-subasta.md
│       ├── join-validacion-categorias.md
│       ├── logica-montos-pujas.md
│       ├── multas-bloqueos.md
│       ├── native-tabs.md
│       ├── perfil-medios-pago.md
│       ├── publicacion-articulos.md
│       ├── streaming-sse.md
│       └── subastas-listado.md
│
└── lib/                            # Directorio vacío (para futuros utilities)
```

---

## Arquitectura

```
app/ (Expo Router — file-based)
  ├── _layout.tsx (root) → <AuthProvider> + <Stack>
  │
  ├── (auth)/          → Stack sin auth (welcome, login, register, forgot-password)
  ├── (tabs)/          → Bottom tabs (inicio, en vivo, subastas, perfil)
  ├── consignar.tsx    → Wizard de publicación
  └── subasta/[id]/    → Detalle de subasta

src/ (lógica de negocio)
  ├── services/   → Axios API calls
  ├── context/    → AuthContext (estado global)
  ├── types/      → Interfaces TypeScript
  ├── constants/  → Tokens de diseño
  └── utils/      → Utilidades (SecureStore)
```

### Principios aplicados

- **File-based routing** con Expo Router v6
- **Separación por capas**: UI (app/) separada de lógica (src/)
- **Servicios centralizados** con Axios e interceptores de autenticación
- **Contexto global mínimo**: solo auth, el resto es estado local
- **Navegación con guest**: usuarios no autenticados pueden ver contenido público

---

## Routing (Expo Router)

### Layout raíz (`app/_layout.tsx`)

```tsx
<AuthProvider>
  <Stack screenOptions={{ headerShown: false }} />
</AuthProvider>
```

### Grupos de rutas

| Grupo          | Layout              | Pantallas                                          |
| -------------- | ------------------- | -------------------------------------------------- |
| `(auth)`       | Stack sin header    | welcome, login, register-step1, register-step2, forgot-password |
| `(tabs)`       | Bottom tabs (4)     | index (Inicio), live (En Vivo), subastas, profile  |
| `subasta`      | Stack sin header    | `[id]/index` (detalle de subasta)                  |
| `consignar`    | (ruta plana)        | consignar (wizard 4 pasos)                         |

### Navegación programática

```typescript
router.push('/login');
router.push('/subasta/123');
router.replace('/(tabs)');
```

### Tabs

Los 4 tabs del layout principal usan `expo-router/unstable-native-tabs` con iconos MaterialIcons:

| Tab       | Icono           | Ruta         |
| --------- | --------------- | ------------ |
| Inicio    | `home`          | `(tabs)/`    |
| En Vivo   | `live-tv`       | `(tabs)/live`|
| Subastas  | `gavel`         | `(tabs)/subastas` |
| Perfil    | `person`        | `(tabs)/profile`  |

---

## Pantallas y Componentes

### Auth Flow `(auth)`

| Pantalla             | Descripción                                                      |
| -------------------- | ---------------------------------------------------------------- |
| `welcome.tsx`        | Landing: branding SubastApp, features, botones login/register/invitado |
| `login.tsx`          | Formulario documento + password, validación, manejo de errores (401/403/400), link forgot password |
| `register-step1.tsx` | Formulario datos personales + upload fotos DNI (frente/dorso) con expo-image-picker |
| `register-step2.tsx` | Verificación de token + creación de password con medidor de fortaleza |
| `forgot-password.tsx`| Input email + envío de link de recuperación + pantalla de confirmación |

### Main App `(tabs)`

| Pantalla       | Descripción                                                      |
| -------------- | ---------------------------------------------------------------- |
| `index.tsx`    | Home: saludo personalizado, carrusel horizontal "En Vivo", lista vertical "Próximas Subastas" con pull-to-refresh |
| `live.tsx`     | 3 estados: no auth (login prompt), lobby (lista subastas en vivo), activo (streaming, info item actual, botones de puja rápida 1%/5%/10%/20%, input personalizado, historial en tiempo real) |
| `subastas.tsx` | Listado: barra de búsqueda, filtros por categoría, stats (total/en vivo/próximas), cards de subastas |
| `profile.tsx`  | 4 sub-tabs: **Subastas** (historial con búsqueda), **Perfil** (avatar, datos, badge categoría, notificaciones, logout), **Pagos** (medios de pago con verificación + multas), **Metricas** (stats: subastas, ganadas, éxito %, pujas, total ofertado/pagado) |

### Otras pantallas

| Pantalla              | Descripción                                                      |
| --------------------- | ---------------------------------------------------------------- |
| `subasta/[id]/index`  | Detalle: badges categoría/estado, fecha/ubicación, catálogo con fotos, precio base/oferta actual, botón "Ir a subasta en vivo" |
| `consignar.tsx`       | Wizard 4 pasos: (1) título/categoría/descripción, (2) historia/procedencia/artista/declaraciones, (3) fotos (6-10), (4) confirmación |

---

## Servicios API

### Cliente HTTP (`src/services/api.ts`)

```typescript
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

// Request interceptor: adjunta Bearer token
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: on 401, elimina token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) await deleteToken();
    return Promise.reject(error);
  }
);
```

### Servicios disponibles

| Archivo              | Funcionalidad                                                |
| -------------------- | ------------------------------------------------------------ |
| `authService.ts`     | login, logout, register (paso 1 con FormData, paso 2), forgot/reset password |
| `auctionService.ts`  | listar subastas (públicas/autenticado), detalle, join/leave, historial pujas, pujar, pagos |
| `articleService.ts`  | publicar artículo (con fotos en FormData), listar publicaciones, detalle, aceptar tasación, aumentar seguro |
| `userService.ts`     | perfil (get/update), medios de pago (CRUD), métricas, multas, notificaciones. Incluye normalización de campos (`foto_url` → `foto`) |

### Idempotency Key

El servicio de pujas soporta el header `Idempotency-Key` para prevenir pujas duplicadas en caso de reintentos.

---

## Tipos TypeScript

| Archivo        | Interfaces principales                                         |
| -------------- | -------------------------------------------------------------- |
| `auth.ts`      | `LoginRequest`, `TokenResponse`, `RegistroPaso1Request`, `RegistroPaso2Request` |
| `user.ts`      | `Usuario`, `UsuarioUpdate`, `UsuarioMetricas`                  |
| `payment.ts`   | `MedioPago`, `MedioPagoInput`, `Multa`                         |
| `auction.ts`   | `SubastaListado`, `SubastaDetalle`, `ItemCatalogo`, `Puja`, `PagoSubasta` |
| `article.ts`   | `Articulo`, `ArticuloInput`                                    |
| `common.ts`    | `Categoria`, `Moneda`, `Notificacion`, `StreamEvent`, `StreamDataType`, `Seguro` |

---

## Estado Global (AuthContext)

### `src/context/AuthContext.tsx`

| Estado            | Tipo                          | Descripción                          |
| ----------------- | ----------------------------- | ------------------------------------ |
| `isLoading`       | `boolean`                     | Cargando estado inicial              |
| `isAuthenticated` | `boolean`                     | Usuario autenticado?                 |
| `token`           | `string \| null`              | JWT token actual                     |
| `user`            | `Usuario \| null`             | Datos del usuario autenticado        |

| Función          | Descripción                                         |
| ---------------- | --------------------------------------------------- |
| `login()`        | Guarda token en SecureStore, actualiza estado       |
| `logout()`       | Elimina token de SecureStore, llama a POST /logout  |
| `refreshUser()`  | Recarga datos del usuario desde GET /usuarios/me    |

### Flujo de inicialización

1. Al montar la app, `AuthProvider` verifica `SecureStore` en busca de token
2. Si existe token, intenta obtener datos del usuario y setea `isAuthenticated = true`
3. En 401, elimina el token automáticamente (interceptor de Axios)

---

## Diseño y Tema

### Paleta de colores (`tailwind.config.js`)

| Token     | Color        | Uso                         |
| --------- | ------------ | --------------------------- |
| `primary` | `#8B6914`    | Dorado premium (acciones, highlights) |
| `cream`   | `#F5F0E8`    | Fondo crema                  |

### Categorías de subasta

| Categoría | Color     |
| --------- | --------- |
| Comun     | Verde     |
| Especial  | Azul      |
| Plata     | Gris      |
| Oro       | Dorado    |
| Platino   | Púrpura   |

### Tokens de diseño (`src/constants/theme.ts`)

Define `Colors`, `Fonts`, `Spacing`, `BorderRadius` usados con `StyleSheet.create()`.

---

## Configuración

### Variables de entorno

| Variable                 | Valor                                    |
| ------------------------ | ---------------------------------------- |
| `EXPO_PUBLIC_API_URL`    | `https://backend-da1.onrender.com`       |

### `app.json` — Configuración Expo

| Propiedad          | Valor                             |
| ------------------ | --------------------------------- |
| `name`             | frontend-da1                      |
| `scheme`           | frontendda1                       |
| `orientation`      | portrait                          |
| `newArchEnabled`   | true (Fabric)                     |
| `plugins`          | expo-router, expo-splash-screen, expo-secure-store |

### `tsconfig.json`

- `strict: true`
- Path alias: `@/*` → `./*`
- Extiende `expo/tsconfig.base`

---

## Cómo ejecutar

### Requisitos

- Node.js 18+
- Expo CLI (`npx expo`)
- iOS Simulator (macOS) o Android Emulator, o Expo Go app en dispositivo físico

### Instalación y desarrollo

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar .env con la URL del backend
#    EXPO_PUBLIC_API_URL=https://backend-da1.onrender.com

# 3. Iniciar servidor de desarrollo
npx expo start
#    Presiona 'i' para iOS simulator
#    Presiona 'a' para Android emulator
#    Presiona 'w' para web
#    Escanea QR con Expo Go

# Comandos adicionales
npm run ios       # Inicia en iOS simulator
npm run android   # Inicia en Android emulator
npm run web       # Inicia en navegador
npm run lint      # Ejecuta ESLint
```

---

## Testing

Actualmente **no hay infraestructura de tests** (no hay Jest, ni archivos `*.test.*`, ni directorio `__tests__/`).
