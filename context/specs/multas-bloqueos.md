# Spec 10: Lógica de Multas y Bloqueos de Usuario

## Objetivo

Implementar la gestión de multas y el bloqueo temporal del usuario por incumplimiento de pago.

## Tareas Backend (FastAPI + Supabase)

1.  **Generar multa al usuario**:
    - Si el usuario no cumple con el pago en tiempo, crear una multa del 10% del monto ofertado.
    - Guardar la multa con estado `pendiente` y fecha límite de pago.
2.  **Endpoint `GET /usuarios/me/multas`**:
    - Listar multas activas para el usuario.
3.  **Endpoint `POST /usuarios/me/multas/pagar`**:
    - Permitir abonar una multa con un medio de pago verificado.
    - Marcar multa como `pagada` y liberar el bloqueo si corresponde.
4.  **Bloqueo de usuario**:
    - Bloquear al usuario para nuevas subastas si tiene multa pendiente o incumplimiento grave.
    - Rechazar acceso a pujas y a join a subastas si está bloqueado.

## Tareas Frontend (React Native)

1.  Mostrar advertencias de multa en el perfil del usuario.
2.  Permitir pagar multas desde la app.
3.  Bloquear la opción de unirse a nuevas subastas si el usuario está sancionado.

## Criterios de Aceptación

- El usuario recibe una multa del 10% tras incumplir el pago.
- El usuario bloqueado no puede pujar ni unirse a nuevas subastas.
- Pagar la multa libera el bloqueo correctamente.
