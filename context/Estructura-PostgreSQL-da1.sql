-- Postgres-compatible DDL adapted for Supabase
-- Minimal fixes: fecha check cast and fotos -> url (VARCHAR)

create table paises(
    numero int not null,
    nombre varchar(250) not null,
    nombreCorto varchar(250) null,
    capital varchar(250) not null,
    nacionalidad varchar(250) not null,
    idiomas varchar(150) not null,
    constraint pk_paises primary key (numero)
);

create table personas(
    identificador serial not null,
    documento varchar(20) not null,
    nombre varchar(150) not null,
    direccion varchar(250),
    estado varchar(15) constraint chkEstado check (estado in ('activo', 'inactivo')),
    foto varchar(2048),
    constraint pk_personas primary key (identificador)
);

create table empleados(
    identificador int not null,
    cargo varchar(100),
    sector int null,
    constraint pk_empleados primary key (identificador)
);

create table sectores(
    identificador serial not null,
    nombreSector varchar(150) not null,
    codigoSector varchar(10) null,
    responsableSector int null,
    constraint pk_sectores primary key (identificador),
    constraint fk_sectores_empleados foreign key (responsableSector) references empleados(identificador)
);

create table seguros(
    nroPoliza varchar(30) not null,
    compania varchar(150) not null,
    polizaCombinada varchar(2) constraint chkpolizaCombinada check(polizaCombinada in ('si','no')),
    importe numeric(18,2) not null constraint chkImporte check (importe > 0),
    constraint pk_seguro primary key (nroPoliza)
);
    
create table clientes(
    identificador int not null,
    numeroPais int,
    admitido varchar(2) constraint chkAdmitido check(admitido in ('si','no')),
    categoria varchar(10) constraint chkCategoria check (categoria in ('comun', 'especial', 'plata', 'oro', 'platino')),
    verificador int not null,
    constraint pk_clientes primary key (identificador),
    constraint fk_clientes_personas foreign key (identificador) references personas(identificador),
    constraint fk_clientes_empleados foreign key (verificador) references empleados(identificador),
    constraint fk_clientes_paises foreign key (numeroPais) references paises(numero)
);

create table duenios(
    identificador int not null,
    numeroPais int,
    verificacionFinanciera varchar(2) constraint chkVF check(verificacionFinanciera in ('si','no')),
    verificacionJudicial varchar(2) constraint chkVJ check(verificacionJudicial in ('si','no')),
    calificacionRiesgo int constraint chkCR check(calificacionRiesgo in (1,2,3,4,5,6)),
    verificador int not null,
    constraint pk_duenios primary key (identificador),
    constraint fk_duenios_personas foreign key (identificador) references personas(identificador),
    constraint fk_duenios_empleados foreign key (verificador) references empleados(identificador)
);

create table subastadores(
    identificador int not null,
    matricula varchar(15),
    region varchar(50),
    constraint pk_subastadores primary key (identificador),
    constraint fk_subastadores_personas foreign key (identificador) references personas(identificador)
);

create table subastas(
    identificador serial not null,
    -- las subastas tienen al menos 10 dias de anticipación al momento de crearlas.
    fecha date constraint chkFecha check (fecha > (current_date + INTERVAL '10 days')::date),
    hora time not null,
    estado varchar(10) constraint chkES check (estado in ('abierta','cerrada')),
    subastador int null,
    -- direccion donde se desarrolla el evento.
    ubicacion varchar(350) null,
    capacidadAsistentes int null,
    -- caracteristica del lugar donde se hacen las subastas
    tieneDeposito varchar(2) constraint chkTD check(tieneDeposito in ('si','no')),
    -- caracteristica del lugar donde se hacen las subastas
    seguridadPropia varchar(2) constraint chkSP check(seguridadPropia in ('si','no')),
    categoria varchar(10) constraint chkCS check (categoria in ('comun', 'especial', 'plata', 'oro', 'platino')),
    constraint pk_subastas primary key (identificador),
    constraint fk_subastas_subastadores foreign key (subastador) references subastadores(identificador)
);

create table productos(
    identificador serial not null,
    fecha date,
    disponible varchar(2) constraint chkD check (disponible in ('si','no')),
    -- se obtiene despues que un empleado realiza la revision.
    descripcionCatalogo varchar(500) null default 'No Posee',
    -- url que apunta a un documento PDF firmado que contiene la descripción del producto.
    descripcionCompleta varchar(300) not null,
    revisor int not null,
    duenio int not null,
    seguro varchar(30) null,  
    constraint pk_productos primary key (identificador),
    constraint fk_productos_empleados foreign key (revisor) references empleados(identificador),
    constraint fk_productos_duenios foreign key (duenio) references duenios(identificador)
);

create table fotos(
    identificador serial not null,
    producto int not null,
    url varchar(2048) not null,
    constraint pk_fotos primary key (identificador),
    constraint fk_fotos_productos foreign key (producto) references productos(identificador)
);

create table catalogos(
    identificador serial not null,
    descripcion varchar(250) not null,
    subasta int null,
    responsable int not null,
    constraint pk_catalogos primary key (identificador),
    constraint fk_catalogos_empleados foreign key (responsable) references empleados(identificador),
    constraint fk_catalogos_subastas foreign key (subasta) references subastas(identificador)
);

create table itemsCatalogo(
    identificador serial not null,
    catalogo int not null,
    producto int not null,
    precioBase numeric(18,2) not null constraint chkPB check (precioBase > 0.01),
    comision numeric(18,2) not null constraint chkC check (comision > 0.01),
    subastado varchar(2) constraint chkS check (subastado in ('si','no')),
    constraint pk_itemsCatalogo primary key (identificador),
    constraint fk_itemsCatalogo_catalogos foreign key (catalogo) references catalogos(identificador),
    constraint fk_itemsCatalogo_productos foreign key (producto) references productos(identificador)
);

create table asistentes(
    identificador serial not null,
    numeroPostor int not null,
    cliente int not null,
    subasta int not null,
    constraint pk_asistentes primary key (identificador),
    constraint fk_asistentes_clientes foreign key (cliente) references clientes(identificador),
    constraint fk_asistentes_subasta foreign key (subasta) references subastas(identificador)
);

create table pujos(
    identificador serial not null,
    asistente int not null,
    item int not null,
    importe numeric(18,2) not null constraint chkI check (importe > 0.01),
    ganador varchar(2) constraint chkG check (ganador in ('si','no')) default 'no',
    constraint pk_pujos primary key (identificador),
    constraint fk_pujos_asistentes foreign key (asistente) references asistentes(identificador),
    constraint fk_pujos_itemsCatalogo foreign key (item) references itemsCatalogo(identificador)
);

create table registroDeSubasta(
    identificador serial not null,
    subasta int not null,
    duenio int not null,
    producto int not null,
    cliente int not null,
    importe numeric(18,2) not null constraint chkImportePagado check (importe > 0.01),
    comision numeric(18,2) not null constraint chkComisionPagada check (comision > 0.01),
    constraint pk_registroDeSubasta primary key (identificador),
    constraint fk_registroDeSubasta_subastas foreign key (subasta) references subastas(identificador),
    constraint fk_registroDeSubasta_duenios foreign key (duenio) references duenios(identificador),
    constraint fk_registroDeSubasta_producto foreign key (producto) references productos(identificador),
    constraint fk_registroDeSubasta_cliente foreign key (cliente) references clientes(identificador)
);
