# Spec 06: Unión a Subasta y Validación de Categorías

## Objetivo

Implementar el flujo de conexión del usuario a una subasta y las reglas de acceso por categoría y medio de pago.

## Tareas Backend (FastAPI + Supabase)

1.  **Endpoint `POST /subastas/{id}/join`**:
    - Validar que el usuario está autenticado.
    - Verificar que la categoría del usuario es mayor o igual a la categoría de la subasta.
    - Verificar que existe al menos un medio de pago verificado.
    - Verificar que el usuario no está en otra subasta activa.
    - Crear sesión de subasta y retornar `201`.
2.  **Endpoint `DELETE /subastas/{id}`**:
    - Permitir salir de una subasta activa.
    - Finalizar la sesión activa para ese usuario y subasta.

## Tareas Frontend (React Native)

1.  Permitir que el usuario seleccione una subasta y se una si cumple los requisitos.
2.  Mostrar mensajes claros cuando la categoría o el medio de pago impida el acceso.
3.  Ofrecer una acción para salir de la subasta activa.

## Criterios de Aceptación

- Un usuario con categoría insuficiente no puede unirse.
- Un usuario sin medio de pago verificado no puede unirse.
- El usuario no puede estar en más de una subasta activa al mismo tiempo.
