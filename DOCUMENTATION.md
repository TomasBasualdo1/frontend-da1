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
│   │   ├── register-step2.tsx      # Registro paso 2 (token + password + medio de pago)
│   │   ├── forgot-password.tsx     # Recuperación de contraseña
│   │   └── reset-password.tsx      # Restablecer contraseña con token
│   │
│   ├── (tabs)/                     # Grupo de rutas con tabs (app principal)
│   │   ├── _layout.tsx             # Bottom tab layout (4 tabs)
│   │   ├── index.tsx               # Home — subastas destacadas y próximas
│   │   ├── live.tsx                # Subastas en vivo con bidding en tiempo real
│   │   ├── subastas.tsx            # Listado de subastas con búsqueda/filtros
│   │   └── profile.tsx             # Perfil con 4 sub-tabs (Perfil, Consignaciones, Pagos & Multas, Métricas)
│   │
│   ├── admin/                      # Panel de administración
│   │   ├── index.tsx               # Dashboard con 4 cards de acceso
│   │   ├── users.tsx               # Verificación de registros y gestión de usuarios
│   │   ├── articles.tsx            # Inspección y evaluación de artículos consignados
│   │   ├── payments.tsx            # Verificación de medios de pago pendientes
│   │   └── auctions.tsx            # Gestión de subastas: crear, catalogar, cerrar
│   │
│   ├── subasta/                    # Grupo de detalle de subasta
│   │   ├── _layout.tsx             # Stack layout sin header
│   │   └── [id]/
│   │       └── index.tsx           # Detalle de subasta (catálogo + join)
│   │
│   ├── consignar.tsx               # Wizard de 4 pasos para publicar artículo
│   └── pagos/[subastaId].tsx       # Pantalla de pago: resumen, medio de pago, modo entrega
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
│   │   ├── auctionService.ts       # Endpoints de subastas + SSE streaming
│   │   ├── articleService.ts       # Endpoints de artículos (consignación, tasación, seguro)
│   │   ├── userService.ts          # Endpoints de usuario (perfil, medios de pago, métricas, multas)
│   │   └── adminService.ts         # Endpoints de administración
│   │
│   ├── types/
│   │   ├── index.ts                # Re-exporta todos los tipos
│   │   ├── common.ts               # Categoria, Moneda, Notificacion, StreamEvent, Seguro
│   │   ├── auth.ts                 # LoginRequest, TokenResponse, RegistroPaso1/2, ResetPassword
│   │   ├── user.ts                 # Usuario, UsuarioUpdate, UsuarioMetricas
│   │   ├── payment.ts              # MedioPago, MedioPagoInput, Multa, MultaPagoRequest
│   │   ├── auction.ts              # SubastaListado, SubastaDetalle, ItemCatalogo, Puja, Pago, GarantiaInsuficiente
│   │   └── article.ts              # Articulo, ArticuloInput
│   │
│   └── utils/
│       ├── storage.ts              # Wrapper de SecureStore (nativo + web fallback)
│       └── auctionSchedule.ts      # Clasificación de subastas (en vivo/programada/abierta/finalizada)
│
├── assets/images/                  # Iconos, splash, logo
│
├── context/                        # Documentación interna y especificaciones
│   ├── project-overview.md
│   ├── architecture-context.md
│   ├── code-standards.md
│   ├── ai-workflow-rules.md
│   └── specs/                      # 11 specs de funcionalidades
│       ├── 01-auth-setup.md
│       ├── 02-auth-login.md
│       ├── 03-perfil-medios-pago.md
│       ├── 04-publicacion-articulos.md
│       ├── 05-subastas-listado.md
│       ├── 06-join-validacion-categorias.md
│       ├── 07-logica-montos-pujas.md
│       ├── 08-streaming-sse.md
│       ├── 09-cierre-subasta.md
│       ├── 10-multas-bloqueos.md
│       └── 11-native-tabs.md
│
└── .agents/skills/                 # Skills para agentes de IA
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
| `(auth)`       | Stack sin header    | welcome, login, register-step1, register-step2, forgot-password, reset-password |
| `(tabs)`       | Bottom tabs (4)     | index (Inicio), live (En Vivo), subastas, profile  |
| `admin`        | Stack sin header    | index (Dashboard), users, articles, payments, auctions |
| `subasta`      | Stack sin header    | `[id]/index` (detalle de subasta)                  |
| `consignar`    | (ruta plana)        | consignar (wizard 4 pasos)                         |
| `pagos`        | Stack sin header    | `[subastaId]` (pago de subasta)                    |

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
| `register-step2.tsx` | Verificación de token + creación de password con medidor de fortaleza + medio de pago opcional |
| `forgot-password.tsx`| Input email + envío de link de recuperación + pantalla de confirmación |
| `reset-password.tsx` | Input de código de 6 dígitos + nueva contraseña con medidor de fortaleza + confirmación |

### Main App `(tabs)`

| Pantalla       | Descripción                                                      |
| -------------- | ---------------------------------------------------------------- |
| `index.tsx`    | Home: saludo personalizado, carrusel horizontal "En Vivo", lista vertical "Próximas Subastas" con pull-to-refresh |
| `live.tsx`     | 3 estados: no auth (login prompt), lobby (lista subastas en vivo con validación de categoría), activo (streaming SSE, info item actual, botones de puja rápida 1%/5%/10%/20%, input personalizado, historial en tiempo real, manejo de error GARANTIA_INSUFICIENTE) |
| `subastas.tsx` | Listado: barra de búsqueda, filtros por categoría, stats (total/en vivo/próximas), cards de subastas con indicador "Solo espectador" para guest |
| `profile.tsx`  | 4 sub-tabs: **Perfil** (avatar, datos, badge categoría, editar perfil, notificaciones, logout, acceso admin), **Mis Consignaciones** (artículos publicados con estado, tasación, seguro, ubicación, fotos), **Pagos & Multas** (medios de pago CRUD con verificación, multas con pago), **Métricas** (subastas participadas, ganadas, % éxito, pujas, totales ofertado/pagado) |

### Otras pantallas

| Pantalla              | Descripción                                                      |
| --------------------- | ---------------------------------------------------------------- |
| `subasta/[id]/index`  | Detalle: hero image con gradiente, badges categoría/estado, fecha/ubicación, catálogo con fotos y precios (base + mejor oferta), botón "Ingresar a la Sala en Vivo" o "Ver deuda y pagar" según estado |
| `consignar.tsx`       | Wizard 4 pasos: (1) título/categoría/descripción, (2) historia/procedencia/artista/declaraciones de propiedad y origen lícito, (3) fotos (mín 6, máx 10), (4) confirmación |
| `pagos/[subastaId]`   | Pago de subasta: resumen (total pujado, comisión, envío, total final), selector de medio de pago con compatibilidad (moneda, fondos, estado), modo entrega (envío con dirección o retiro con waiver de seguro), confirmación |

### Admin `(admin)`

| Pantalla          | Descripción                                                      |
| ----------------- | ---------------------------------------------------------------- |
| `admin/index`     | Dashboard con 4 cards: Verificación de Registros, Medios de Pago, Artículos Consignados, Gestión de Subastas |
| `admin/users`     | Dos tabs: **Pendientes** (aprobar con selector de categoría / rechazar con motivo, ver fotos DNI) y **Todos los Usuarios** (búsqueda, modificar categoría) |
| `admin/articles`  | Lista de artículos pendientes con detalle (fotos, historia, artista). Modal de evaluación: aprobar con precio base y comisión, o rechazar con motivo |
| `admin/payments`  | Lista de medios de pago pendientes de verificación con datos del titular. Botones validar/rechazar con confirmación |
| `admin/auctions`  | Tres tabs: **Ver Subastas** (listado, catalogar ítem, cerrar), **Crear Evento** (fecha >10 días, hora, categoría, moneda, subastador, ubicación), **Catalogar** (seleccionar subasta + artículo aprobado, definir precio base y comisión) |

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
| `authService.ts`     | login, logout, registro paso 1 (FormData con fotos DNI), registro paso 2 (token + password + medio de pago), forgot/reset password, listar países |
| `auctionService.ts`  | Listar subastas públicas/autenticadas, detalle, join/leave, historial pujas, pujar (con Idempotency-Key), streaming SSE con auto-reconexión, pagos (get/confirmar), admin: crear subasta, catalogar items, cerrar subasta |
| `articleService.ts`  | Publicar artículo (multipart con fotos), listar mis publicaciones, detalle, aceptar/rechazar tasación, solicitar aumento de seguro |
| `userService.ts`     | Perfil (get/update/delete avatar), medios de pago CRUD, métricas, multas (listar/pagar), notificaciones (listar/marcar leída). Incluye normalización de campos |
| `adminService.ts`    | Usuarios pendientes, verificar usuario, todos los usuarios, modificar categoría. Artículos pendientes, evaluar artículo. Medios de pago pendientes, verificar medio de pago. Subastadores, artículos aprobados no catalogados |

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
