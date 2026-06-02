# Spec 03: Gestión de Perfil y Medios de Pago

## Objetivo

Implementar los endpoints de perfil de usuario y la gestión de sus medios de pago verificados.

## Tareas Backend (FastAPI + Supabase)

1.  **Endpoint `GET /usuarios/me`**:
    - Retornar el perfil autenticado.
    - Incluir `categoria`, `estadoRegistro`, `multaActiva` y `bloqueado`.
2.  **Endpoint `PATCH /usuarios/me`**:
    - Permitir actualizar `nombre`, `apellido`, `direccion`, `telefono` y `foto`.
    - Soportar `multipart/form-data` para la carga de fotos.
3.  **Medios de pago**:
    - `GET /usuarios/me/medios-pago` listar medios de pago del usuario.
    - `POST /usuarios/me/medios-pago` crear un nuevo medio de pago.
    - `PATCH /usuarios/me/medios-pago/{id}` actualizar datos de un medio.
    - `DELETE /usuarios/me/medios-pago/{id}` eliminar un medio.
4.  **Métodos complementarios de perfil**:
    - `GET /usuarios/me/metricas` para métricas del usuario.
    - `GET /usuarios/me/multas` para ver multas activas.
    - `POST /usuarios/me/multas/pagar` para pagar una multa.
    - `GET /usuarios/me/notificaciones` y `POST /usuarios/me/notificaciones/{id}/leer`.

## Tareas Frontend (React Native)

1.  Crear pantalla `ProfileScreen` que muestre datos del usuario y estado de aprobación.
2.  Implementar formulario de edición de perfil con upload de imagen.
3.  Crear flujo de listado y alta de medios de pago.
4.  Mostrar métricas, multas y notificaciones en la vista de perfil.

## Criterios de Aceptación

- El usuario puede ver y actualizar su perfil autenticado.
- El usuario puede administrar sus medios de pago.
- Los datos de perfil y medios de pago solo son accesibles con un token válido.
