# Progress Tracker

## Phase 1: Autenticación y Perfil

- [x] Spec 01: Registro Paso 1 (Multipart Form Data).
  - [x] Backend: Endpoint /registro/paso1, StorageService (Supabase Storage), UsuarioRepository (inserts en personas/personas_adicionales/clientes/clientes_adicionales con estadoRegistro: pendiente).
  - [x] Frontend: RegisterStep1Screen con expo-image-picker y consumo de API.
- [x] Spec 02: Login y JWT Auth.
  - [x] Backend: Login endpoint, JWT generation, Logout y Blacklist.
  - [x] Frontend: LoginScreen, almacenamiento seguro del token (SecureStore), redirect y manejo de errores 400/401/403.
- [x] Spec 03: Gestión de Perfil y Medios de Pago.
  - [x] Backend: Enpoints, actualizacion de datos y metodos de pago.
  - [x] Frontend: UI de gestion de perfil y consumo de API.

## Phase 2: Catálogo y Consignación

- [x] Spec 04: Publicación de Artículos por el usuario.
  - [x] Backend: Endpoints de consignación (POST /articulos, GET /articulos/mis-publicaciones, etc.) e integración de almacenamiento.
  - [x] Frontend: Wizard de publicación de artículos de 4 pasos (ConsignarScreen), listado y seguimiento expandido con aceptación de tasación y aumento de seguro.
- [x] Spec 05: Listado Público y Privado de Subastas.
  - [x] Backend: Endpoints para listar subastas públicas (sin auth) y privadas (autenticado) y sus detalles alineados en P1.1.
  - [x] Frontend: Pantalla de listado de subastas (SubastasScreen) con filtros y búsqueda, y detalle de catálogo.
  - [x] Frontend: Normalización defensiva de listados/detalles en `auctionService`.

## Phase 3: Motor de Pujas (Core)

- [/] Spec 06: Unión a subasta (`/join`) y validación de categorías.
  - [ ] Backend: Endpoint /subastas/{id}/join y validación de reglas de ingreso (categoría y medios de pago).
  - [x] Frontend: Flujo de conexión en LiveScreen.
- [ ] Spec 07: Lógica de validación de montos (1% - 20%).
  - [ ] Backend: Validación de montos de pujas (+1% mínimo, +20% máximo) en endpoint place_bid.
  - [x] Frontend: Botones de pujo rápido (+1%/+5%/+10%/+20%) e input en LiveScreen.
- [ ] Spec 08: Integración de Streaming (SSE).
  - [ ] Backend: Servicio SSE en /subastas/{id}/stream para notificar pujas y items.
  - [ ] Frontend: Escucha de eventos de streaming y actualización en tiempo real en LiveScreen.

## Phase 4: Pagos y Multas

- [ ] Spec 09: Cierre de subasta y generación de deuda.
  - [ ] Backend: Lógica de cierre (/cerrar), asignación de ganador, comisiones y multas.
  - [ ] Frontend: Visualización de deudas pendientes e interfaz de pago en perfil.
- [/] Spec 10: Lógica de Multas (10%) y bloqueos de usuario.
  - [x] Backend: Endpoints para consultar y pagar multas (/me/multas).
  - [x] Frontend: Visualización en Perfil y funcionalidad de pago.
  - [ ] Backend: Restricción y bloqueo de participación para usuarios sancionados.

## Misc

- [x] Spec 11: Native Tabs (Expo SDK 54) — **Frontend actualizado**.

> Nota: Se han añadido specs detalladas para los puntos 02 a 10 en `context/specs/`.
