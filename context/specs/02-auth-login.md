# Spec 02: Login y JWT Auth

## Objetivo

Implementar el inicio de sesión y la emisión de tokens JWT para proteger los endpoints privados.

## Tareas Backend (FastAPI + Supabase)

1.  **Endpoint `POST /auth/login`**:
    - Validar `documento` y `password` contra la base de datos.
    - Rechazar si el usuario está `bloqueado`, `estadoRegistro` diferente de `aprobado` o no está `admitido`.
    - Emitir JWT con al menos el `usuarioId`, `categoria` y `admitido`.
    - Retornar `200` con `TokenResponse` o `401/403` según el estado.
2.  **Middleware / dependencia JWT**:
    - Implementar dependencia FastAPI para leer `Authorization: Bearer ...`.
    - Devolver `401` si el token es inválido o expirado.
    - Devolver `403` si el usuario no tiene permiso para acceder al recurso.
3.  **Documentar los errores** para login y acceso no autorizado.

## Tareas Frontend (React Native)

1.  Crear pantalla `LoginScreen` con input para `documento` y `password`.
2.  Consumir `POST /auth/login` y almacenar el token en un store seguro.
3.  Redirigir al usuario a la pantalla principal después de un login exitoso.
4.  Mostrar mensajes claros para `400`, `401` y `403`.

## Criterios de Aceptación

- El login exitoso devuelve un JWT utilizable en los endpoints protegidos.
- Los endpoints privados rechazan peticiones sin token o con token inválido.
- El frontend puede iniciar sesión y navegar a contenido autenticado.
