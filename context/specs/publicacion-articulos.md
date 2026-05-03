# Spec 04: Publicación de Artículos por el Usuario

## Objetivo

Implementar el circuito de consignación de artículos por parte de los usuarios.

## Tareas Backend (FastAPI + Supabase)

1.  **Endpoint `POST /articulos`**:
    - Recibir datos y al menos 6 fotos como `multipart/form-data`.
    - Guardar el artículo en estado `pendiente` y subir fotos a storage.
    - Validar `esPropietario` y `declaraOrigenLicito`.
2.  **Endpoint `GET /articulos/mis-publicaciones`**:
    - Listar los artículos cargados por el usuario.
3.  **Endpoint `GET /articulos/{id}`**:
    - Obtener detalle del artículo con su estado y segura.
4.  **Valoración y seguro**:
    - `POST /articulos/{id}/aceptar-tasacion` para aceptar/rechazar condiciones.
    - `POST /articulos/{id}/seguro/aumentar` para solicitar aumento de cobertura.

## Tareas Frontend (React Native)

1.  Crear pantalla `ConsignacionScreen` con formulario de carga de artículo y fotos.
2.  Permitir ver el listado de artículos propios y el detalle de cada artículo.
3.  Implementar flujo de aceptación de tasación y solicitud de seguro.

## Criterios de Aceptación

- Un usuario puede cargar un artículo con fotos y textos obligatorios.
- El artículo queda en estado `pendiente` hasta evaluación.
- El usuario puede consultar sus publicaciones y estados.
