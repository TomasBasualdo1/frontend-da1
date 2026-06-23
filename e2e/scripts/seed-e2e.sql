/*
 * Seed E2E — Datos de prueba para tests automatizados (Maestro).
 *
 * IDs asignados en el rango 800000-800099 para no colisionar con:
 *   - datos reales de producción
 *   - seed demo (900000+)
 *
 * Credenciales de prueba:
 *   USUARIO_VALIDO      documento=12345678  password=password123  estado=aprobado  categoria=comun
 *   USUARIO_NO_APROBADO  documento=99999991  password=password123  estado=pendiente
 *   USUARIO_BLOQUEADO    documento=99999992  password=password123  estado=bloqueado
 *
 * Admin (documento 00000003) YA EXISTE en Supabase — NO se incluye en este seed.
 *
 * Uso:
 *   psql "$DATABASE_URL" -f e2e/scripts/seed-e2e.sql
 *
 * Rollback:
 *   psql "$DATABASE_URL" -f e2e/scripts/rollback-e2e.sql
 */

BEGIN;

-- ============================================================================
-- 1. INFRASTRUCTURE (FK dependencies)
-- ============================================================================

-- Empleado dummy para FK verificador
INSERT INTO public.personas (identificador, documento, nombre, direccion, estado)
VALUES (800000, 'E2E-EMP-001', 'E2E Tester Verificador', 'Deposito E2E, CABA', 'activo')
ON CONFLICT (identificador) DO UPDATE SET
  documento = EXCLUDED.documento,
  nombre = EXCLUDED.nombre;

INSERT INTO public.empleados (identificador, cargo, sector)
VALUES (800000, 'Verificador E2E', 900001)
ON CONFLICT (identificador) DO UPDATE SET
  cargo = EXCLUDED.cargo;

-- Subastador dummy para FK subastador en subastas
INSERT INTO public.personas (identificador, documento, nombre, direccion, estado)
VALUES (800007, 'E2E-SUB-001', 'Martillero E2E', 'Av. Callao 1400, CABA', 'activo')
ON CONFLICT (identificador) DO UPDATE SET
  documento = EXCLUDED.documento,
  nombre = EXCLUDED.nombre;

INSERT INTO public.subastadores (identificador, matricula, region)
VALUES (800007, 'MAT-E2E-001', 'AMBA')
ON CONFLICT (identificador) DO UPDATE SET
  matricula = EXCLUDED.matricula,
  region = EXCLUDED.region;

-- ============================================================================
-- 2. TEST USERS (personas + personas_adicionales + clientes + clientes_adicionales)
-- ============================================================================

-- 2a. USUARIO_VALIDO (estado=aprobado, categoria=comun)
INSERT INTO public.personas (identificador, documento, nombre, direccion, estado)
VALUES (800001, '12345678', 'Juan E2E Valido', 'Calle Falsa 123, CABA', 'activo')
ON CONFLICT (identificador) DO UPDATE SET
  documento = EXCLUDED.documento,
  nombre = EXCLUDED.nombre;

INSERT INTO public.personas_adicionales (identificador, email, password_hash, telefono)
VALUES (800001, 'juan.e2e@example.com',
        '$2b$12$xz6qvQK8TZI7IjIx/QfmQupDd.cjbxiHqSrMbakmQqzCNAdzR7fGy',
        '+54 11 5555-0001')
ON CONFLICT (identificador) DO UPDATE SET
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash;

INSERT INTO public.clientes (identificador, numeropais, admitido, categoria, verificador)
VALUES (800001, 1, 'si', 'comun', 800000)
ON CONFLICT (identificador) DO UPDATE SET
  numeropais = EXCLUDED.numeropais,
  admitido = EXCLUDED.admitido,
  categoria = EXCLUDED.categoria;

INSERT INTO public.clientes_adicionales (identificador, estado_registro, multa_activa, bloqueado)
VALUES (800001, 'aprobado', false, false)
ON CONFLICT (identificador) DO UPDATE SET
  estado_registro = EXCLUDED.estado_registro,
  multa_activa = EXCLUDED.multa_activa,
  bloqueado = EXCLUDED.bloqueado;

-- Tambien es duenio (para tests de consignar)
INSERT INTO public.duenios (identificador, numeropais, verificacionfinanciera, verificacionjudicial, calificacionriesgo, verificador)
VALUES (800001, 1, 'si', 'si', 2, 800000)
ON CONFLICT (identificador) DO NOTHING;

-- 2b. USUARIO_NO_APROBADO (estado=pendiente)
INSERT INTO public.personas (identificador, documento, nombre, direccion, estado)
VALUES (800002, '99999991', 'Maria E2E Pendiente', 'Av. Rivadavia 5500, CABA', 'activo')
ON CONFLICT (identificador) DO UPDATE SET
  documento = EXCLUDED.documento,
  nombre = EXCLUDED.nombre;

INSERT INTO public.personas_adicionales (identificador, email, password_hash, telefono)
VALUES (800002, 'maria.e2e@example.com',
        '$2b$12$xz6qvQK8TZI7IjIx/QfmQupDd.cjbxiHqSrMbakmQqzCNAdzR7fGy',
        '+54 11 5555-0002')
ON CONFLICT (identificador) DO UPDATE SET
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash;

INSERT INTO public.clientes (identificador, numeropais, admitido, categoria, verificador)
VALUES (800002, 1, 'no', 'comun', 800000)
ON CONFLICT (identificador) DO UPDATE SET
  numeropais = EXCLUDED.numeropais,
  admitido = EXCLUDED.admitido,
  categoria = EXCLUDED.categoria;

INSERT INTO public.clientes_adicionales (identificador, estado_registro, multa_activa, bloqueado)
VALUES (800002, 'pendiente', false, false)
ON CONFLICT (identificador) DO UPDATE SET
  estado_registro = EXCLUDED.estado_registro,
  multa_activa = EXCLUDED.multa_activa,
  bloqueado = EXCLUDED.bloqueado;

-- 2c. USUARIO_BLOQUEADO
INSERT INTO public.personas (identificador, documento, nombre, direccion, estado)
VALUES (800003, '99999992', 'Pedro E2E Bloqueado', 'Calle Monteagudo 200, CABA', 'activo')
ON CONFLICT (identificador) DO UPDATE SET
  documento = EXCLUDED.documento,
  nombre = EXCLUDED.nombre;

INSERT INTO public.personas_adicionales (identificador, email, password_hash, telefono)
VALUES (800003, 'pedro.e2e@example.com',
        '$2b$12$xz6qvQK8TZI7IjIx/QfmQupDd.cjbxiHqSrMbakmQqzCNAdzR7fGy',
        '+54 11 5555-0003')
ON CONFLICT (identificador) DO UPDATE SET
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash;

INSERT INTO public.clientes (identificador, numeropais, admitido, categoria, verificador)
VALUES (800003, 1, 'no', 'comun', 800000)
ON CONFLICT (identificador) DO UPDATE SET
  numeropais = EXCLUDED.numeropais,
  admitido = EXCLUDED.admitido,
  categoria = EXCLUDED.categoria;

INSERT INTO public.clientes_adicionales (identificador, estado_registro, multa_activa, bloqueado)
VALUES (800003, 'aprobado', false, true)
ON CONFLICT (identificador) DO UPDATE SET
  estado_registro = EXCLUDED.estado_registro,
  multa_activa = EXCLUDED.multa_activa,
  bloqueado = EXCLUDED.bloqueado;

-- Duenio adicional para articulos (puede ser el mismo USUARIO_VALIDO)
-- No se necesita duenio separado, 800001 ya lo es.

-- ============================================================================
-- 3. SUBASTAS
-- ============================================================================

-- 3a. SUBASTA_ABIERTA (fecha futura, estado=abierta, categoria=comun)
INSERT INTO public.subastas (identificador, fecha, hora, estado, subastador, ubicacion, capacidadasistentes, tienedeposito, seguridadpropia, categoria, moneda)
VALUES (800010, CURRENT_DATE + 15, '14:00:00', 'abierta', 800007, 'Salon Principal, CABA', 50, 'si', 'si', 'comun', 'ARS')
ON CONFLICT (identificador) DO UPDATE SET
  fecha = EXCLUDED.fecha,
  hora = EXCLUDED.hora,
  estado = EXCLUDED.estado;

INSERT INTO public.catalogos (identificador, descripcion, subasta, responsable)
VALUES (800010, 'Catalogo E2E - Subasta Abierta', 800010, 800000)
ON CONFLICT (identificador) DO NOTHING;

INSERT INTO public.productos (identificador, fecha, disponible, descripcioncatalogo, descripcioncompleta, revisor, duenio, seguro)
VALUES (800010, CURRENT_DATE, 'si', 'Reloj Antiguo Suizo', 'Reloj de bolsillo suizo de 1890 en excelente estado de conservacion', 800000, 800001, NULL)
ON CONFLICT (identificador) DO NOTHING;

INSERT INTO public.itemscatalogo (identificador, catalogo, producto, preciobase, comision, subastado)
VALUES (800010, 800010, 800010, 5000.00, 10.00, 'no')
ON CONFLICT (identificador) DO NOTHING;

-- 3b. SUBASTA_EN_VIVO (fecha=hoy, hora=ya pasada, estado=abierta)
INSERT INTO public.subastas (identificador, fecha, hora, estado, subastador, ubicacion, capacidadasistentes, tienedeposito, seguridadpropia, categoria, moneda)
VALUES (800011, CURRENT_DATE, (LOCALTIME - INTERVAL '2 hours')::time, 'abierta', 800007, 'Salon Secundario, CABA', 30, 'si', 'si', 'comun', 'USD')
ON CONFLICT (identificador) DO UPDATE SET
  fecha = EXCLUDED.fecha,
  hora = EXCLUDED.hora,
  estado = EXCLUDED.estado;

INSERT INTO public.catalogos (identificador, descripcion, subasta, responsable)
VALUES (800011, 'Catalogo E2E - Subasta en Vivo', 800011, 800000)
ON CONFLICT (identificador) DO NOTHING;

INSERT INTO public.productos (identificador, fecha, disponible, descripcioncatalogo, descripcioncompleta, revisor, duenio, seguro)
VALUES (800011, CURRENT_DATE, 'si', 'Pintura al Oleo Siglo XIX', 'Obra de arte original, oleo sobre lienzo, marco dorado', 800000, 800001, NULL)
ON CONFLICT (identificador) DO NOTHING;

INSERT INTO public.itemscatalogo (identificador, catalogo, producto, preciobase, comision, subastado)
VALUES (800011, 800011, 800011, 15000.00, 12.00, 'no')
ON CONFLICT (identificador) DO NOTHING;

-- 3c. SUBASTA_FINALIZADA (estado=cerrada)
INSERT INTO public.subastas (identificador, fecha, hora, estado, subastador, ubicacion, capacidadasistentes, tienedeposito, seguridadpropia, categoria, moneda)
VALUES (800012, CURRENT_DATE - 7, '10:00:00', 'cerrada', 800007, 'Salon Principal, CABA', 40, 'si', 'si', 'comun', 'ARS')
ON CONFLICT (identificador) DO UPDATE SET
  fecha = EXCLUDED.fecha,
  hora = EXCLUDED.hora,
  estado = EXCLUDED.estado;

INSERT INTO public.catalogos (identificador, descripcion, subasta, responsable)
VALUES (800012, 'Catalogo E2E - Subasta Finalizada', 800012, 800000)
ON CONFLICT (identificador) DO NOTHING;

INSERT INTO public.productos (identificador, fecha, disponible, descripcioncatalogo, descripcioncompleta, revisor, duenio, seguro)
VALUES (800012, CURRENT_DATE - 10, 'si', 'Escritorio de Roble Antiguo', 'Escritorio de roble macizo, estilo Luis XV, s. XIX', 800000, 800001, NULL)
ON CONFLICT (identificador) DO NOTHING;

INSERT INTO public.itemscatalogo (identificador, catalogo, producto, preciobase, comision, subastado)
VALUES (800012, 800012, 800012, 25000.00, 8.00, 'si')
ON CONFLICT (identificador) DO NOTHING;

-- ============================================================================
-- 4. MEDIOS DE PAGO PARA USUARIO_VALIDO
-- ============================================================================

-- Medio validado (cuenta bancaria en ARS con limite alto)
INSERT INTO public.medios_pago (identificador, cliente_id, tipo, datos_encriptados, ultimos_digitos, estado_verificacion, moneda, limite_reservado, pais_banco)
VALUES (800001, 800001, 'cuenta_bancaria', 'encrypted-cbu-placeholder', '5678', 'validado', 'ARS', 1000000, 'AR')
ON CONFLICT (identificador) DO UPDATE SET
  estado_verificacion = EXCLUDED.estado_verificacion,
  limite_reservado = EXCLUDED.limite_reservado;

-- Medio pendiente (para que admin lo verifique)
INSERT INTO public.medios_pago (identificador, cliente_id, tipo, datos_encriptados, ultimos_digitos, estado_verificacion, moneda, limite_reservado, pais_banco)
VALUES (800002, 800001, 'tarjeta_credito', 'encrypted-cc-placeholder', '1234', 'pendiente', 'USD', 50000, 'US')
ON CONFLICT (identificador) DO UPDATE SET
  estado_verificacion = EXCLUDED.estado_verificacion;

-- ============================================================================
-- 5. MULTA PENDIENTE PARA USUARIO_VALIDO
-- ============================================================================

INSERT INTO public.multas (identificador, cliente_id, importe, estado, fecha_limite, motivo, medio_pago_id)
VALUES (800001, 800001, 3500.00, 'pendiente', CURRENT_TIMESTAMP + INTERVAL '5 days', 'Pago vencido subasta anterior', NULL)
ON CONFLICT (identificador) DO UPDATE SET
  importe = EXCLUDED.importe,
  estado = EXCLUDED.estado,
  fecha_limite = EXCLUDED.fechaLimite;

-- ============================================================================
-- 6. ARTICULO PENDIENTE PARA ADMIN EVALUATION
-- ============================================================================

INSERT INTO public.articulos (identificador, duenio_id, descripcion, historia, artista, fecha_creacion, es_propietario, declara_origen_licito, estado, fotos)
VALUES (800001, 800001, 'Collar de Perlas Naturales', 'Pertenecio a una coleccion privada desde 1920', 'Desconocido', '1900-01-01', true, true, 'pendiente', ARRAY['https://example.com/e2e/collar-1.jpg', 'https://example.com/e2e/collar-2.jpg'])
ON CONFLICT (identificador) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  estado = EXCLUDED.estado;

-- ============================================================================
-- 7. PAGO PENDIENTE PARA SUBASTA FINALIZADA (debt scenario)
-- ============================================================================

INSERT INTO public.pagos (identificador, subasta_id, cliente_id, total_pujado, comision, costo_envio, total_final, moneda, modo_entrega, estado, fecha_limite_pago, medio_pago_id)
VALUES (800001, 800012, 800001, 25000.00, 2000.00, 0.00, 27000.00, 'ARS', NULL, 'pendiente', CURRENT_TIMESTAMP + INTERVAL '3 days', 800001)
ON CONFLICT (identificador) DO UPDATE SET
  total_pujado = EXCLUDED.total_pujado,
  estado = EXCLUDED.estado;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- SELECT identificador, documento, nombre FROM personas WHERE identificador BETWEEN 800000 AND 800010;
-- SELECT identificador, email, password_hash FROM personas_adicionales WHERE identificador BETWEEN 800000 AND 800010;
-- SELECT identificador, admitido, categoria FROM clientes WHERE identificador BETWEEN 800001 AND 800003;
-- SELECT identificador, estado_registro, bloqueado FROM clientes_adicionales WHERE identificador BETWEEN 800001 AND 800003;
-- SELECT identificador, fecha, hora, estado, categoria FROM subastas WHERE identificador BETWEEN 800010 AND 800012;
-- SELECT identificador, estado_verificacion FROM medios_pago WHERE identificador BETWEEN 800001 AND 800002;
-- SELECT identificador, importe, estado FROM multas WHERE identificador = 800001;
-- SELECT identificador, descripcion, estado FROM articulos WHERE identificador = 800001;
-- SELECT identificador, total_pujado, estado FROM pagos WHERE identificador = 800001;
