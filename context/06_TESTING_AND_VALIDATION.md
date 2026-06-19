# 06 · Testing & Validación

## Estado de testing

- **No hay tests automatizados** en el repo (sin Jest, sin `__tests__`, sin `jest-expo`).
- La validación es **manual** (correr la app) + **lint** + **type-check** de TypeScript.

## Lint

```bash
npm run lint          # expo lint (ESLint con eslint-config-expo)
```
Config en `eslint.config.js` (flat config, ignora `dist/*`).

## Type-check

No hay script dedicado, pero TS está en `strict`. Para chequear tipos sin emitir:
```bash
npx tsc --noEmit
```
(Verificá la versión: `typescript ~5.9.2`.) Corré esto antes de commitear cambios de tipos/servicios.

## Correr para validar manualmente

```bash
npm start            # luego elegí plataforma (a=Android, i=iOS, w=web)
npm run web          # rápido para probar lógica/UI en navegador
```

## Checklist de validación manual

Según lo que toques, probá el flujo de punta a punta:

- **Auth**: welcome → registro paso1 (subir 2 fotos) → paso2 → login → que el guard lleve a tabs → logout.
- **Listados**: `index` y `subastas` cargan datos; búsqueda/filtros de `subastas` funcionan; pull-to-refresh.
- **Detalle**: `subasta/[id]` muestra catálogo.
- **En vivo**: `live` → join → pujar (botones rápidos + monto manual) → ver respuesta de límites; salir.
- **Perfil**: ver datos/métricas; agregar/editar/eliminar medio de pago; ver multas/notificaciones; editar perfil + foto.
- **Consignar**: completar wizard, validar que exige ≥6 fotos y declaraciones.
- **Errores**: con backend caído, los `Alert` aparecen; con 401 vuelve a login.

## Checklist antes de commitear

- [ ] `npm run lint` sin errores nuevos.
- [ ] `npx tsc --noEmit` sin errores (strict).
- [ ] La app compila y corre (al menos en web).
- [ ] El flujo afectado funciona contra un backend real (`EXPO_PUBLIC_API_URL`).
- [ ] No hardcodeé URLs ni tokens; uso `EXPO_PUBLIC_API_URL` y `storage.ts`.
- [ ] Tipos en `src/types/` actualizados si cambió el contrato; normalizers ajustados.
- [ ] `.env` no commiteado (gitignored).
- [ ] Si la feature tenía spec, actualicé `context/progress-tracker.md`.

## Recomendación

Si se agrega testing, lo natural en este stack es **`jest-expo`** + React Native Testing Library. No está configurado hoy (ver [08_PENDING_CONTEXT.md](08_PENDING_CONTEXT.md)).
