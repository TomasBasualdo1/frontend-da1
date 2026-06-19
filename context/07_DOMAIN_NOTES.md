# 07 · Domain Notes

Dominio del **Sistema de Subastas** desde la óptica del cliente.

> **Fuente de verdad del dominio**: la consigna oficial del TPO (Desarrollo de Aplicaciones I, 1C2026). El texto está en **`context/consignas.md`** (este repo) y, completo con entregables, en **`backend-da1/context/TPO_DAI_1C2026.md`**. La lógica de negocio "dura" vive en el backend; el frontend la **refleja y respeta**, no la reimplementa.

## Glosario (mínimo necesario en el front)

| Término | En la app |
|---------|-----------|
| **Subasta** | Evento con catálogo de ítems; estado `abierta`/`cerrada`; tiene `categoria`. |
| **Postor / usuario** | Cliente autenticado; tiene `categoria` (`comun`→`platino`) y debe estar `admitido`. |
| **Puja** | Oferta sobre un ítem; sujeta a límites 1%/20% (subastas no premium). |
| **Ítem de catálogo** | Objeto subastable con `precioBase`, `mejorOfertaActual`, `limiteMinimo/Maximo`. |
| **Consignar** | Proponer un artículo propio (mín. 6 fotos + declaraciones). |
| **Multa** | 10% por no pagar lo ganado; bloquea participar. |
| **Medio de pago** | Debe estar `validado` para unirse a subastas y pagar. |

## Categorías (orden)

`comun < especial < plata < oro < platino`. La categoría del usuario debe alcanzar la de la subasta para poder unirse (lo valida el backend; el front muestra el 403 como "no cumplís los requisitos"). Colores de badge en `theme.ts` (`categComun`…`categPlatino`) y mapas `CATEG_COLORS`/`CATEG_LABELS` repetidos por pantalla.

## Flujos de negocio (cómo se ven en la UI)

1. **Registro (2 pasos)**: `register-step1` (datos + fotos DNI) → email con token → `register-step2` (password + medio de pago). Hasta que un admin lo apruebe, el login puede fallar con 403.
2. **Login**: `login` → token en SecureStore → guard lleva a `(tabs)`.
3. **Explorar**: `index` / `subastas` listan subastas; `subasta/[id]` muestra catálogo.
4. **Pujar en vivo** (`live`): unirse (`join`) → ver ítem actual → pujar con botones rápidos (+1/5/10/20%) o monto manual. El backend valida límites y devuelve nuevos `limiteMinimo/Maximo`.
5. **Pagar** (`profile`/flujo de pago): al cerrar la subasta se genera deuda; se confirma con medio de pago validado, modo de entrega (`envio`/`retiro`) y dirección.
6. **Consignar** (`consignar`): wizard que sube artículo (≥6 fotos, declara propiedad y origen lícito). Luego el admin lo evalúa; si se aprueba y el usuario acepta la tasación, se convierte en producto subastable.
7. **Multas/Notificaciones** (`profile`): listar y pagar multas; ver/marcar notificaciones.

## Reglas que el front debe respetar (no romper)

- **No pujar sin estar unido** (el backend responde 403; la UI debe forzar `join` antes).
- **Límites de puja**: usar `limiteMinimo`/`limiteMaximo` que devuelve el backend; los botones +1/5/10/20% son ayuda de UI, **la fuente de verdad es la respuesta del backend**.
- **Medio de pago validado** requerido para unirse/pagar.
- **≥ 6 fotos** y declaraciones obligatorias para consignar (el backend rechaza con 400 si no).
- **Una subasta a la vez**: unirse a otra mientras hay sesión activa → 409.

## Entidades / tipos (en `src/types/`)

`Usuario`, `MedioPago`, `Multa`, `Notificacion`, `UsuarioMetricas` (`user.ts`/`payment.ts`/`common.ts`); `SubastaListado`, `SubastaDetalle[Publica]`, `ItemCatalogo[Publico]`, `Puja`, `Pago`, `SesionSubasta`, `SubastaCreate`, `CatalogoItemInput` (`auction.ts`); `Articulo`, `ArticuloInput`, `Seguro` (`article.ts`); auth en `auth.ts`. Todos espejan el Swagger.

> Para reglas de negocio detalladas (cálculo de multas, cierre, comisiones, seguros), consultá `backend-da1/context/07_DOMAIN_NOTES.md` y `context/consignas.md`.
