# Progress Tracker

## Phase 1: Autenticación y Perfil

- [x] Spec 01: Registro Paso 1 (Multipart Form Data).
  - [x] Backend: Endpoint /registro/paso1, StorageService (Supabase Storage), UsuarioRepository (inserts en personas/personas_adicionales/clientes/clientes_adicionales con estadoRegistro: pendiente).
  - [x] Frontend: RegisterStep1Screen con expo-image-picker y consumo de API.
- [x] Spec 02: Login y JWT Auth.
  - [x] Backend: Login endpoint, JWT generation, Logout y Blacklist.
  - [x] Frontend: LoginScreen, almacenamiento seguro del token (SecureStore), redirect y manejo de errores 400/401/403.
- [ ] Spec 03: Gestión de Perfil y Medios de Pago.
  - [ ] Backend: Enpoints, actualizacion de datos y metodos de pago.
  - [ ] Frontend: UI de gestion de perfil y consumo de API.

## Phase 2: Catálogo y Consignación

- [ ] Spec 04: Publicación de Artículos por el usuario.
  - [ ] Backend: Enpoints, creacion y validacion de JWT.
  - [ ] Frontend: UI de gestion de perfil y consumo de API.
- [ ] Spec 05: Listado Público y Privado de Subastas.
  - [ ] Backend: Enpoints, creacion y validacion de JWT.
  - [ ] Frontend: UI de gestion de perfil y consumo de API.

## Phase 3: Motor de Pujas (Core)

- [x] Spec 06: Unión a subasta (`/join`) y validación de categorías — **Frontend completo**.
- [x] Spec 07: Lógica de validación de montos (1% - 20%) — **Servicio API listo**.
- [x] Spec 08: Integración de Streaming (SSE) — **Pantalla Live con puja completa**.

## Phase 4: Pagos y Multas

- [x] Spec 09: Cierre de subasta y generación de deuda — **Servicio API listo**.
- [x] Spec 10: Lógica de Multas (10%) y bloqueos de usuario — **Visualización en Perfil**.

## Misc

- [x] Spec 11: Native Tabs (Expo SDK 54) — **Frontend actualizado**.

> Nota: Se han añadido specs detalladas para los puntos 02 a 10 en `context/specs/`.
