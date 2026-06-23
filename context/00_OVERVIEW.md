# 00 · Overview

## Qué es

App móvil del **Sistema de Subastas** (internamente "SubastApp"): permite a usuarios verificados registrarse, explorar subastas, pujar, pagar lo ganado y **consignar** artículos propios. Es el cliente de la API `backend-da1`.

Sistema de 2 repos:
- **`frontend-da1`** (este repo) — Expo / React Native + TypeScript. https://github.com/TomasBasualdo1/frontend-da1
- **`backend-da1`** — API REST FastAPI + PostgreSQL/Supabase. https://github.com/TomasBasualdo1/backend-da1 · deploy: `https://backend-da1.onrender.com`

> **Contexto académico**: TPO de la materia **Desarrollo de Aplicaciones I** (1C2026). Consigna oficial en `context/consignas.md` (y completa con entregables en `backend-da1/context/TPO_DAI_1C2026.md`). Se evalúa en 3 entregas (maquetado+API → 50% integrado → 100% funcional con back online y app instalable). Requiere **trazabilidad** diseño↔implementación.

## Qué problema resuelve

Da a los postores una interfaz móvil para participar **online** en las subastas presenciales de la empresa: ver catálogo, unirse a una subasta, pujar respetando reglas (1%/20%), gestionar perfil y medios de pago, pagar deudas, ver multas/notificaciones y proponer artículos para consignación.

## Stack principal

| Categoría | Tecnología |
|-----------|-----------|
| Framework | React Native 0.81.5 + **Expo SDK 54** (New Architecture activada) |
| Lenguaje | TypeScript 5.9 (strict) |
| Routing | **Expo Router v6** (file-based, en `app/`) + typed routes |
| Navegación tabs | `expo-router/unstable-native-tabs` (NativeTabs) |
| HTTP | **Axios** con interceptores (`src/services/api.ts`) |
| Estado global | **React Context** (`AuthContext`) + `useState` local |
| Estilos | **`StyleSheet.create` + tokens en `src/constants/theme.ts`** (NativeWind está instalado/configurado pero casi sin uso — ver 03) |
| Almacenamiento | `expo-secure-store` (nativo) / `localStorage` (web) vía `src/utils/storage.ts` |
| Imágenes | `expo-image`, `expo-image-picker` |
| Iconos | `@expo/vector-icons` (MaterialIcons) |
| Lint | ESLint (`eslint-config-expo`) |

## Estructura del repo

```
frontend-da1/
├── app/                      # Rutas (Expo Router). Cada archivo = pantalla.
│   ├── _layout.tsx           # Root: AuthProvider + guard de navegación
│   ├── (auth)/               # Stack de autenticación (welcome, login, registro, reset)
│   ├── (tabs)/               # Tabs principales (index, live, subastas, profile)
│   ├── subasta/[id]/         # Detalle de subasta (ruta dinámica)
│   └── consignar.tsx         # Wizard de consignación de artículos
├── src/
│   ├── services/             # Clientes de API (axios) por dominio
│   ├── context/AuthContext.tsx  # Estado de auth global
│   ├── types/                # Tipos TS (espejo del Swagger)
│   ├── constants/theme.ts    # Design tokens (colores, spacing, radios)
│   └── utils/storage.ts      # Wrapper SecureStore/localStorage
├── assets/                   # Imágenes, íconos, splash
├── context/                  # ESTA documentación + consigna + Swagger + specs
├── app.json / package.json / tsconfig.json / tailwind.config.js ...
└── DOCUMENTATION.md          # Doc técnica extendida previa (complementaria)
```

> Nota: `src/context/` también contiene una copia vieja de `AuthContext.tsx`. **El que se usa es `src/context/AuthContext.tsx`** importado en `app/_layout.tsx` — confirmar que no haya duplicado activo (ver [08_PENDING_CONTEXT.md](08_PENDING_CONTEXT.md)).

## Relación con el otro repo

Consume `backend-da1` por HTTP REST con JWT Bearer. El contrato es `Swagger_v5.YAML` (copiado en `context/`), del que derivan los tipos en `src/types/`. Detalle en [11_INTEGRATION.md](11_INTEGRATION.md).
