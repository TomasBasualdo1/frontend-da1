# Spec 07: Lógica de Validación de Montos de Puja

## Objetivo

Implementar la validación de montos para las ofertas de subasta según las reglas de negocio.

## Tareas Backend (FastAPI + Supabase)

1.  **Endpoint `POST /subastas/{id}/items/{itemId}/pujar`**:
    - Validar `Idempotency-Key` para evitar duplicados.
    - Validar que la oferta es mayor a la última puja.
    - Calcular el mínimo como `mejorOfertaActual + 1% del precio base`, cuando aplique.
    - Calcular el máximo como `mejorOfertaActual + 20% del precio base`, cuando aplique.
    - Excluir límites para categorías `oro` y `platino`.
    - Retornar `201` si la puja es aceptada.
2.  **Manejo de errores claros**:
    - `400` si la puja no está en el rango válido.
    - `403` si el usuario no tiene categoría o pago válido.
    - `409` si hay conflicto de concurrencia.

## Tareas Frontend (React Native)

1.  Mostrar los límites mínimos y máximos antes de enviar la puja.
2.  Validar localmente la puja antes de enviarla al servidor.
3.  Manejar estados de espera mientras la puja se procesa.

## Criterios de Aceptación

- El backend rechaza pujas fuera del rango permitido.
- La UI muestra los límites correctos y evita envíos inválidos.
