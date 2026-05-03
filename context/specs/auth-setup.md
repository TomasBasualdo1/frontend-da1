# Spec 01: Autenticación Inicial y Registro (Paso 1)

## Objetivo

Implementar el circuito de registro de usuarios e inicio de sesión según el requerimiento de dos etapas[cite: 12, 15].

## Tareas Backend (FastAPI + Supabase)

1.  **Endpoint `POST /auth/registro/paso1`**:
    - Recibir datos personales y subir `fotoFrente` y `fotoDorso` a Supabase Storage.
    - Guardar usuario con `estadoRegistro: pendiente`.
    - _Output esperado_: Código 201 (creado) o 409 (duplicado).
2.  **Endpoint `POST /auth/login`**:
    - Validar `documento` y `password`.
    - Emitir JWT. Retornar error 403 si el usuario está `bloqueado` o no aprobado.

## Tareas Frontend (React Native)

1.  Crear pantalla `LoginScreen` con input para documento y contraseña.
2.  Crear pantalla `RegisterStep1Screen` que incluya un formulario y un selector de imágenes nativo para las fotos del DNI.
3.  Implementar manejo de errores UI para status 400 y 401[cite: 84].

## Criterios de Aceptación

- Un usuario nuevo puede enviar su registro con imágenes, las cuales quedan alojadas correctamente en el bucket de Supabase.
- Un usuario existente en BD puede loguearse y recibir su Bearer Token.
