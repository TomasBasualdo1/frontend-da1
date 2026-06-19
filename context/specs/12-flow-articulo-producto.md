# Spec 12: Flow from Article to Product

## Objetivo

Completar el flujo backend para que un usuario pueda publicar un articulo en consignacion, que un admin lo evalue, y que luego, si el usuario acepta la tasacion, ese articulo se convierta finalmente en un producto subastable.

## Alcance

- Trabajo principal en `backend-da1`.
- No modificar `frontend-da1` salvo que exista una incompatibilidad estrictamente necesaria con el contrato backend.
- No modificar el schema SQL salvo que el schema real no soporte el flujo y se documente antes.
- Usar como fuente de verdad:
  - `backend-da1/db/Estructura-PostgreSQL-da1-updated.sql`
  - schemas Pydantic existentes
  - arquitectura actual del proyecto
  - Swagger vigente

## Diagnostico previo obligatorio

Antes de implementar, verificar y documentar:

1. Que existe actualmente en `app/repositories/articulo_repo.py`.
2. Que endpoints de articulos/admin existen y cuales son stubs.
3. Que schemas existen para articulo, evaluacion, seguro y aceptacion de tasacion.
4. Que tablas y columnas reales participan en el flujo.
5. Diferencias entre esta spec y el schema real.
6. Archivos que se van a modificar.

## Tareas Backend - Repository Layer

Archivo principal: `backend-da1/app/repositories/articulo_repo.py`.

1.  **`ensure_duenio(db, persona_id)`**
    - Verificar si existe `duenios` para la persona.
    - Si no existe, buscar el pais desde `clientes`.
    - Insertar un registro default en `duenios` usando solo campos reales del schema.
    - Devolver el `duenio_id`.

2.  **`create_articulo(db, duenio_id, data)`**
    - Insertar en `articulos`.
    - Estado inicial: `pendiente`.
    - Guardar datos enviados por el usuario.
    - Guardar fotos segun el modelo real.
    - Devolver el articulo creado.

3.  **`get_articulo(db, id)`**
    - Obtener articulo por ID.
    - Incluir poliza desde `seguros` si existe.
    - Devolver respuesta compatible con schemas actuales.

4.  **`list_articulos_by_owner(db, duenio_id)`**
    - Listar articulos publicados por un duenio.
    - Respetar nombres y relaciones reales.

5.  **`evaluar_articulo(db, id, evaluacion)`**
    - Validar existencia del articulo.
    - Actualizar estado, precio base propuesto, comision y motivo de rechazo si aplica.
    - Usar columnas reales del schema.

6.  **`aceptar_tasacion(db, id, acepta)`**
    - Registrar la decision de tasacion.
    - Si `acepta = true`:
      - Crear poliza en `seguros` por el importe del precio base propuesto.
      - Crear producto en `productos`.
      - Usar `revisor = 1` salvo convencion distinta del proyecto.
      - Usar `duenio` del articulo.
      - Guardar el numero de poliza en el producto.
      - Insertar fotos del articulo en `fotos_adicionales` o tabla real equivalente.
    - Si `acepta = false`:
      - Actualizar el articulo a estado `devuelto`.
    - Mantener la operacion atomica con commit/rollback segun patron del proyecto.

## Tareas Backend - Routing Layer

Archivo: `backend-da1/app/api/articulos.py`.

1.  **`POST /articulos`**
    - Recibir `ArticuloInput` o schema equivalente.
    - Identificar usuario autenticado.
    - Ejecutar `ensure_duenio`.
    - Crear articulo en estado `pendiente`.
    - Devolver articulo creado.

2.  **`GET /articulos/mis-publicaciones`**
    - Devolver publicaciones del usuario autenticado.
    - Resolver o asegurar duenio asociado.
    - Responder en formato compatible con Swagger/frontend.

3.  **`GET /articulos/{id}`**
    - Devolver detalle de articulo.
    - Responder `404` si no existe.
    - Responder `403` si el articulo no pertenece al usuario.
    - Permitir acceso si el usuario autenticado es admin con ID `1`.

4.  **`POST /articulos/{id}/aceptar-tasacion`**
    - Recibir `{"acepta": boolean}`.
    - Validar que el articulo pertenezca al usuario autenticado.
    - Si acepta, disparar transicion articulo -> seguro -> producto -> fotos.
    - Si rechaza, pasar a `devuelto`.
    - Devolver resultado actualizado.

Archivo: `backend-da1/app/api/admin.py`.

5.  **`POST /admin/articulos/{id}/evaluar`**
    - Verificar admin con ID `1`.
    - Responder `403` si no es admin.
    - Recibir evaluacion.
    - Actualizar articulo usando repository.
    - Devolver articulo evaluado.

## Schemas

Archivo: `backend-da1/app/schemas/schemas.py`.

- Reutilizar schemas existentes si estan presentes:
  - `ArticuloInput`
  - `Articulo`
  - `ArticuloEvaluacion`
  - `Seguro`
- Agregar solo schemas minimos faltantes, por ejemplo:
  - `AceptarTasacionRequest` con `acepta: bool`
- No duplicar schemas existentes.

## Tests

Crear `backend-da1/tests/test_flow_articulo_producto.py`.

Usar `unittest` y mantener consistencia con los mocks existentes.

Comando esperado:

```bash
.venv/bin/python -m unittest tests/test_flow_articulo_producto.py
```

Debe cubrir:

1. Crear articulo en estado `pendiente`.
2. Evaluacion admin:
   - Rechaza usuarios no admin.
   - Permite admin con ID `1`.
3. Aceptacion de tasacion con `{"acepta": true}`:
   - Intenta insertar en `seguros`.
   - Intenta insertar en `productos`.
   - Intenta insertar en `fotos_adicionales` o tabla real equivalente.
4. Rechazo de tasacion con `{"acepta": false}`:
   - Estado final `devuelto`.

## Criterios de Aceptacion

- El usuario puede publicar un articulo y queda `pendiente`.
- El admin ID `1` puede evaluar el articulo.
- Usuarios no admin no pueden evaluar articulos.
- El duenio puede ver solo sus publicaciones y detalles propios.
- Admin ID `1` puede ver cualquier articulo.
- Si el usuario acepta la tasacion, se crea seguro, producto y fotos asociadas.
- Si el usuario rechaza la tasacion, el articulo queda `devuelto`.
- No se inventan tablas, columnas ni nombres de campos.
- La implementacion respeta la arquitectura actual del backend.

## Payloads de referencia

Publicar articulo:

```json
{
  "descripcion": "Reloj antiguo del siglo XIX",
  "historia": "Pertenecio a una coleccion familiar",
  "artista": "Desconocido",
  "fechaCreacion": "1890-01-01",
  "fotos": [
    "https://example.com/1.jpg",
    "https://example.com/2.jpg",
    "https://example.com/3.jpg",
    "https://example.com/4.jpg",
    "https://example.com/5.jpg",
    "https://example.com/6.jpg"
  ],
  "documentacionOrigen": ["https://example.com/doc.pdf"],
  "esPropietario": true,
  "declaraOrigenLicito": true
}
```

Evaluar articulo como admin:

```json
{
  "estado": "aprobado",
  "precioBasePropuesto": 150000,
  "comisionPropuesta": 12
}
```

Aceptar tasacion:

```json
{ "acepta": true }
```

Rechazar tasacion:

```json
{ "acepta": false }
```

## Notas de mapeo esperadas

- Si el schema real usa `duenios.identificador` como ID del duenio, usar ese campo.
- Si el pais esta en `clientes.numeropais`, usar ese nombre real.
- Si existe `articulos.tasacion_aceptada`, mapearlo a `tasacionAceptada` en respuesta.
- Si existe `fotos_adicionales`, usarla para URLs de fotos de producto.
- Si `productos.seguro` existe pero no tiene FK declarada, guardar igualmente el numero de poliza creado y documentar el hallazgo.
