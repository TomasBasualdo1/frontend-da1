# Spec 08: Integración de Streaming (SSE)

## Objetivo

Implementar la transmisión en tiempo real de eventos de subasta usando Server-Sent Events.

## Tareas Backend (FastAPI + Supabase)

1.  **Endpoint `GET /subastas/{id}/stream`**:
    - Validar JWT antes de aceptar la conexión.
    - Verificar que el usuario tiene permitido ver la subasta.
    - Emitir eventos `puja` y `item` con payloads consistentes.
2.  **Estructura de eventos**:
    - `type`: `puja` o `item`.
    - `fechaHora`: timestamp ISO.
    - `data`: objeto con el detalle de la puja o del item.
3.  **Concurrencia y actualizaciones**:
    - Enviar actualizaciones cuando cambia la mejor puja o el catálogo.
    - Mantener la conexión abierta durante la sesión de subasta.

## Tareas Frontend (React Native)

1.  Conectar el cliente SSE al endpoint de la subasta activa.
2.  Actualizar en tiempo real el estado de la mejor puja y la lista de items.
3.  Manejar reconexiones y condiciones de cierre de la subasta.

## Criterios de Aceptación

- El cliente recibe eventos SSE válidos mientras la subasta está abierta.
- Las pujas y cambios de catálogo se reflejan en la UI sin recargar.
