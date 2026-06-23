/*
 * Rollback E2E — Limpia todos los datos insertados por seed-e2e.sql.
 *
 * Uso:
 *   psql "$DATABASE_URL" -f e2e/scripts/rollback-e2e.sql
 */

BEGIN;

-- Orden inverso de dependencias (FK-safe)

DELETE FROM public.pagos WHERE identificador = 800001;
DELETE FROM public.articulos WHERE identificador = 800001;
DELETE FROM public.multas WHERE identificador = 800001;
DELETE FROM public.medios_pago WHERE identificador IN (800001, 800002);

DELETE FROM public.itemscatalogo WHERE identificador BETWEEN 800010 AND 800012;
DELETE FROM public.productos WHERE identificador BETWEEN 800010 AND 800012;
DELETE FROM public.catalogos WHERE identificador BETWEEN 800010 AND 800012;
DELETE FROM public.subastas WHERE identificador BETWEEN 800010 AND 800012;

DELETE FROM public.clientes_adicionales WHERE identificador BETWEEN 800001 AND 800003;
DELETE FROM public.clientes WHERE identificador BETWEEN 800001 AND 800003;
DELETE FROM public.duenios WHERE identificador = 800001;
DELETE FROM public.personas_adicionales WHERE identificador BETWEEN 800000 AND 800003;
DELETE FROM public.personas WHERE identificador BETWEEN 800000 AND 800007;

DELETE FROM public.subastadores WHERE identificador = 800007;
DELETE FROM public.empleados WHERE identificador = 800000;

COMMIT;

SELECT 'E2E data cleaned up successfully.' AS result;
