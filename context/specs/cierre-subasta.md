# Spec 09: Cierre de Subasta y Generación de Deuda

## Objetivo

Implementar el cierre de subasta y la generación de las obligaciones de pago para los ganadores.

## Tareas Backend (FastAPI + Supabase)

1.  **Endpoint `POST /subastas/{id}/cerrar`**:
    - Validar permisos de administrador.
    - Determinar ganadores y monto final de cada item.
    - Si no hay pujas, registrar que la empresa compra al precio base.
    - Generar el registro de pago correspondiente.
2.  **Endpoint `GET /subastas/{id}/pagos`**:
    - Entregar el resumen de pago del usuario en la subasta.
    - Incluir `totalPujado`, `comision`, `costoEnvio` y `totalFinal`.

## Tareas Frontend (React Native)

1.  Crear pantalla de resumen de pago después de cerrar la subasta.
2.  Mostrar al usuario el detalle de montos y el estado de su obligación.

## Criterios de Aceptación

- El cierre de subasta registra correctamente al ganador y sus pagos.
- El usuario recibe un resumen preciso de su deuda y condición de pago.
