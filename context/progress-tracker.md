# Progress Tracker

## Phase 1: Autenticación y Perfil

- [ ] Spec 01: Registro Paso 1 y 2 (Multipart Form Data).
  - [ ] Backend: Enpoints, subida a Supabase Storage y BD.
  - [ ] Frontend: UI, selector de imagenes/camara(a confirmar) y consumo de API.
- [ ] Spec 02: Login y JWT Auth.
  - [x] Backend: Login endpoint, JWT generation, Logout y Blacklist.
  - [ ] Frontend: UI de Login y almacenamiento seguro del token.
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

- [ ] Spec 06: Unión a subasta (`/join`) y validación de categorías.
- [ ] Spec 07: Lógica de validación de montos (1% - 20%).
- [ ] Spec 08: Integración de Streaming (SSE).

## Phase 4: Pagos y Multas

- [ ] Spec 09: Cierre de subasta y generación de deuda.
- [ ] Spec 10: Lógica de Multas (10%) y bloqueos de usuario.

> Nota: Se han añadido specs detalladas para los puntos 02 a 10 en `context/specs/`.
