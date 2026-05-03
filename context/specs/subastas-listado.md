# Spec 05: Listado Público y Privado de Subastas

## Objetivo

Implementar la visualización de subastas públicas y privadas según el estado del usuario.

## Tareas Backend (FastAPI + Supabase)

1.  **Endpoint `GET /subastas/publicas`**:
    - Listar subastas abiertas sin autenticación.
2.  **Endpoint `GET /subastas/publicas/{id}`**:
    - Mostrar detalle público de una subasta sin precio base.
3.  **Endpoint `GET /subastas`**:
    - Listar subastas disponibles con autorización JWT.
    - Incluir precio base para usuarios que cumplan requisitos.
4.  **Endpoint `GET /subastas/{id}`**:
    - Mostrar detalle de subasta y catálogo para usuarios autenticados.
    - Validar que el usuario tiene acceso a la subasta.

## Tareas Frontend (React Native)

1.  Crear pantalla `PublicAuctionsScreen` para ver subastas públicas.
2.  Crear pantalla `PrivateAuctionsScreen` para usuarios logueados.
3.  Crear detalle de subasta que muestre catálogo y condiciones.

## Criterios de Aceptación

- Usuarios no autenticados ven solo subastas públicas.
- Usuarios autenticados ven subastas privadas y detalles extendidos.
