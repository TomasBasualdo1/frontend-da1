# 02 · Setup & Run

## Requisitos

- Node.js (LTS reciente) + npm.
- Expo SDK 54. Para correr en dispositivo: app **Expo Go** o un emulador Android / simulador iOS.
- El backend (`backend-da1`) corriendo y accesible, o el deploy de Render.

## Instalar

```bash
npm install
```

## Variable de entorno (`.env` en la raíz)

| Variable | Requerida | Notas |
|----------|-----------|-------|
| `EXPO_PUBLIC_API_URL` | Sí (recomendado) | Base URL del backend. Fallback en código: `http://localhost:8000` (`src/services/api.ts`). |

`.env` típico (valores reales en el Notion del equipo):
```
EXPO_PUBLIC_API_URL=https://backend-da1.onrender.com
#EXPO_PUBLIC_API_URL=http://192.168.X.X:8000
```
- **Línea 1 (default)**: apunta al backend **deployado en Render**. Es lo normal para desarrollar el front sin levantar el back.
- **Línea 2**: usar si corrés el backend local. Reemplazá `X` por la IP LAN de tu máquina:
  - Windows: `ipconfig`
  - macOS: `ipconfig getifaddr en0`
- El prefijo `EXPO_PUBLIC_` expone la variable al bundle (convención Expo). Se lee como `process.env.EXPO_PUBLIC_API_URL`.
- ⚠ En dispositivo físico, `localhost` apunta al teléfono, no a tu PC — por eso se usa IP LAN o el host de Render.

## Correr

Flujo recomendado por el equipo (probar en celular real):

```bash
npm install
npx expo start --tunnel    # luego escanear el QR con la app "Expo Go"
```
- `--tunnel` evita problemas de red/firewall entre PC y teléfono (no requiere misma LAN).
- Necesitás la app **Expo Go** instalada en el dispositivo.

Otras formas:
```bash
npm start          # expo start (elegí plataforma en el menú)
npm run android    # emulador/dispositivo Android
npm run ios        # simulador iOS (macOS)
npm run web        # navegador (rápido para probar lógica/UI)
```

Otros scripts (`package.json`):
- `npm run lint` → `expo lint` (ESLint).
- `npm run reset-project` → ⚠ referencia `./scripts/reset-project.js` que **no existe** en el repo (ver [08_PENDING_CONTEXT.md](08_PENDING_CONTEXT.md)). No usar.

## Servicios externos requeridos

- **`backend-da1`** (la API). Sin él, login/registro/listados fallan. Configurar `EXPO_PUBLIC_API_URL` para apuntarlo.
- Imágenes/uploads se suben vía endpoints del backend (que usa Supabase Storage); el front no habla con Supabase directamente.

## Config relevante

- `app.json`: `scheme: "frontendda1"` (deep links), `newArchEnabled: true`, `experiments.typedRoutes: true`, `reactCompiler: true`, plugins `expo-router`, `expo-splash-screen`, `expo-secure-store`.
- `babel.config.js` / `metro.config.js` / `global.css` / `tailwind.config.js`: NativeWind está cableado (aunque las pantallas usan StyleSheet).
- `tsconfig.json`: `strict: true`, alias `@/*` → raíz del repo.

## Build (EAS)

El equipo usa **EAS Build** con un `eas.json` (perfiles `development` / `preview` / `production`). ⚠ **Ese `eas.json` no está versionado en el repo** (vive en Notion) — ver [08_PENDING_CONTEXT.md](08_PENDING_CONTEXT.md). Puntos del config conocido:
- `preview`: distribución `internal`, Android `buildType: apk`, y setea `EXPO_PUBLIC_API_URL=https://backend-da1.onrender.com` en `env`.
- `development`: `developmentClient: true`, distribución `internal`.
- `production`: `autoIncrement: true`.

## Usuario de prueba (QA)

Hay un usuario de prueba (documento `224701`) para smoke tests del flujo autenticado contra Render. Las credenciales están en el Notion del equipo; **no se versionan aquí**.

## Problemas comunes detectables desde el repo

- **"Network Error" / requests cuelgan**: `EXPO_PUBLIC_API_URL` mal seteada o `localhost` en dispositivo físico.
- **Sesión que no persiste**: en web depende de `localStorage`; en nativo de SecureStore.
- **Sale al login solo**: la API devolvió 401 → el interceptor borró el token (token expirado/revocado).
- **Estilos no se ven como Tailwind**: la app usa `StyleSheet` + `theme.ts`, no clases NativeWind (no esperes que `className` funcione en todos lados).
