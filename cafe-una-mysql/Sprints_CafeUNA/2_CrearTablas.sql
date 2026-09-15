-- Sprint 2: tablas por modulo, en su filegroup, con AUTO_INCREMENT en la tabla

USE cafe_una;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seguridad (256 MB)

CREATE TABLE IF NOT EXISTS roles (
    Id     INT         NOT NULL AUTO_INCREMENT,
    Nombre VARCHAR(30) NOT NULL,
    PRIMARY KEY (Id),
    UNIQUE KEY UQ_roles_nombre (Nombre)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci TABLESPACE `Seguridad`;

CREATE TABLE IF NOT EXISTS permisos (
    Id     INT          NOT NULL AUTO_INCREMENT,
    Codigo VARCHAR(80)  NOT NULL,
    Nombre VARCHAR(150) NOT NULL,
    PRIMARY KEY (Id),
    UNIQUE KEY UQ_permisos_codigo (Codigo)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci TABLESPACE `Seguridad`;

CREATE TABLE IF NOT EXISTS rol_permisos (
    IdRol     INT NOT NULL,
    IdPermiso INT NOT NULL,
    PRIMARY KEY (IdRol, IdPermiso),
    FOREIGN KEY (IdRol) REFERENCES roles(Id),
    FOREIGN KEY (IdPermiso) REFERENCES permisos(Id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci TABLESPACE `Seguridad`;

CREATE TABLE IF NOT EXISTS usuarios (
    Id                  INT           NOT NULL AUTO_INCREMENT,
    Nombre              VARCHAR(200)  NOT NULL,
    Correo              VARCHAR(200)  NOT NULL,
    PasswordHash        VARCHAR(500)  NOT NULL,
    Estado              VARCHAR(20)   NOT NULL DEFAULT 'activo',
    Roles               TEXT          NOT NULL,
    FotoPerfilUrl       VARCHAR(2000) NULL,
    FotoBannerUrl       VARCHAR(2000) NULL,
    FotoPerfilPosicion  VARCHAR(30)   NULL,
    FotoBannerPosicion  VARCHAR(30)   NULL,
    PRIMARY KEY (Id),
    UNIQUE KEY UQ_usuarios_correo (Correo),
    UNIQUE KEY UQ_usuarios_nombre (Nombre),
    CHECK (Estado IN ('activo', 'inactivo'))
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci TABLESPACE `Seguridad`;

CREATE TABLE IF NOT EXISTS password_reset_entries (
    Id          INT          NOT NULL AUTO_INCREMENT,
    Token       VARCHAR(20)  NOT NULL,
    Correo      VARCHAR(200) NOT NULL,
    ExpiraEnUtc DATETIME     NOT NULL,
    Usado       TINYINT(1)   NOT NULL DEFAULT 0,
    PRIMARY KEY (Id)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci TABLESPACE `Seguridad`;

CREATE TABLE IF NOT EXISTS registros_pendientes (
    Id           INT          NOT NULL AUTO_INCREMENT,
    Token        VARCHAR(20)  NOT NULL,
    Correo       VARCHAR(200) NOT NULL,
    Nombre       VARCHAR(200) NOT NULL,
    PasswordHash VARCHAR(500) NOT NULL,
    ExpiraEnUtc  DATETIME     NOT NULL,
    Usado        TINYINT(1)   NOT NULL DEFAULT 0,
    PRIMARY KEY (Id)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci TABLESPACE `Seguridad`;

CREATE TABLE IF NOT EXISTS cambios_correo_pendientes (
    Id          INT          NOT NULL AUTO_INCREMENT,
    UsuarioId   INT          NOT NULL,
    NuevoCorreo VARCHAR(200) NOT NULL,
    Token       VARCHAR(20)  NOT NULL,
    ExpiraEnUtc DATETIME     NOT NULL,
    Usado       TINYINT(1)   NOT NULL DEFAULT 0,
    PRIMARY KEY (Id),
    FOREIGN KEY (UsuarioId) REFERENCES usuarios(Id) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci TABLESPACE `Seguridad`;

CREATE TABLE IF NOT EXISTS usuarios_creacion_pendientes (
    Id           INT          NOT NULL AUTO_INCREMENT,
    Token        VARCHAR(20)  NOT NULL,
    Correo       VARCHAR(200) NOT NULL,
    Nombre       VARCHAR(200) NOT NULL,
    PasswordHash VARCHAR(500) NOT NULL,
    Roles        TEXT         NOT NULL,
    ExpiraEnUtc  DATETIME     NOT NULL,
    Usado        TINYINT(1)   NOT NULL DEFAULT 0,
    PRIMARY KEY (Id)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci TABLESPACE `Seguridad`;

-- Operaciones (1024 MB)

CREATE TABLE IF NOT EXISTS auditoria (
    Id         INT          NOT NULL AUTO_INCREMENT,
    Accion     VARCHAR(50)  NOT NULL,
    Tabla      VARCHAR(80)  NOT NULL,
    IdRegistro VARCHAR(50)  NULL,
    Detalle    VARCHAR(500) NOT NULL DEFAULT '',
    Fecha      DATETIME     NOT NULL,
    IdUsuario  INT          NULL,
    PRIMARY KEY (Id),
    FOREIGN KEY (IdUsuario) REFERENCES usuarios(Id) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci TABLESPACE `Operaciones`;

CREATE TABLE IF NOT EXISTS solicitudes_voluntariado (
    Id                    BIGINT        NOT NULL AUTO_INCREMENT,
    UserId                VARCHAR(100)  NOT NULL,
    FechaSolicitud        VARCHAR(20)   NOT NULL,
    Estado                VARCHAR(30)   NOT NULL DEFAULT 'Pendiente',
    Nombre                VARCHAR(200)  NULL,
    Email                 VARCHAR(200)  NULL,
    Telefono              VARCHAR(50)   NULL,
    TipoVoluntariado      VARCHAR(100)  NULL,
    Identificacion        VARCHAR(100)  NULL,
    Institucion           VARCHAR(200)  NULL,
    Pais                  VARCHAR(100)  NULL,
    Modalidad             VARCHAR(100)  NULL,
    CantidadParticipantes INT           NULL,
    Residencia            VARCHAR(200)  NULL,
    Horario               VARCHAR(100)  NULL,
    Dias                  VARCHAR(200)  NULL,
    Area                  VARCHAR(200)  NULL,
    Descripcion           VARCHAR(2000) NULL,
    Motivacion            VARCHAR(2000) NULL,
    PRIMARY KEY (Id)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci TABLESPACE `Operaciones`;

-- Contenido (1024 MB)

CREATE TABLE IF NOT EXISTS hero_principal (
    Id                INT           NOT NULL AUTO_INCREMENT,
    Eyebrow           VARCHAR(200)  NOT NULL DEFAULT '',
    Title             VARCHAR(500)  NOT NULL DEFAULT '',
    Subtitle          VARCHAR(1000) NOT NULL DEFAULT '',
    PrimaryButtonText VARCHAR(200)  NOT NULL DEFAULT '',
    PrimaryButtonUrl  VARCHAR(500)  NOT NULL DEFAULT '',
    ButtonText        VARCHAR(200)  NOT NULL DEFAULT '',
    ButtonUrl         VARCHAR(500)  NOT NULL DEFAULT '',
    BackgroundImage   VARCHAR(2000) NOT NULL DEFAULT '',
    PRIMARY KEY (Id)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci TABLESPACE `Contenido`;

CREATE TABLE IF NOT EXISTS textos_institucionales (
    Clave       VARCHAR(50)   NOT NULL,
    Eyebrow     VARCHAR(200)  NULL,
    Title       VARCHAR(500)  NOT NULL DEFAULT '',
    Description VARCHAR(4000) NOT NULL DEFAULT '',
    Image       VARCHAR(1000) NULL,
    LinkUrl     VARCHAR(1000) NULL,
    LinkText    VARCHAR(200)  NULL,
    PRIMARY KEY (Clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci TABLESPACE `Contenido`;

CREATE TABLE IF NOT EXISTS tarjetas_inicio (
    Clave       VARCHAR(50)   NOT NULL,
    Etiqueta    VARCHAR(100)  NOT NULL DEFAULT '',
    Titulo      VARCHAR(300)  NOT NULL DEFAULT '',
    Descripcion VARCHAR(2000) NOT NULL DEFAULT '',
    Ruta        VARCHAR(300)  NULL,
    TextoBoton  VARCHAR(200)  NOT NULL DEFAULT '',
    Orden       INT           NOT NULL DEFAULT 0,
    PRIMARY KEY (Clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci TABLESPACE `Contenido`;

CREATE TABLE IF NOT EXISTS informacion_navbar (
    Id           INT           NOT NULL AUTO_INCREMENT,
    LogoUrl      VARCHAR(1000) NOT NULL DEFAULT '',
    LogoClaroUrl VARCHAR(1000) NOT NULL DEFAULT '',
    PRIMARY KEY (Id)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci TABLESPACE `Contenido`;

CREATE TABLE IF NOT EXISTS informacion_footer (
    Id             INT           NOT NULL AUTO_INCREMENT,
    LogoUrl        VARCHAR(1000) NOT NULL DEFAULT '',
    LogoClaroUrl   VARCHAR(1000) NOT NULL DEFAULT '',
    FraseMarca     VARCHAR(500)  NOT NULL DEFAULT '',
    Telefono       VARCHAR(50)   NOT NULL DEFAULT '',
    Correo         VARCHAR(200)  NOT NULL DEFAULT '',
    FacebookUrl    VARCHAR(500)  NOT NULL DEFAULT '',
    InstagramUrl   VARCHAR(500)  NOT NULL DEFAULT '',
    MapsUrl        VARCHAR(2000) NOT NULL DEFAULT '',
    TextoCopyright VARCHAR(500)  NOT NULL DEFAULT '',
    PRIMARY KEY (Id)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci TABLESPACE `Contenido`;

CREATE TABLE IF NOT EXISTS enlaces_sitio (
    Id                  BIGINT       NOT NULL AUTO_INCREMENT,
    Etiqueta            VARCHAR(200) NOT NULL,
    Ruta                VARCHAR(500) NOT NULL,
    Seccion             VARCHAR(100) NOT NULL,
    Orden               INT          NOT NULL DEFAULT 1,
    AbrirEnNuevaPestana TINYINT(1)   NOT NULL DEFAULT 0,
    PRIMARY KEY (Id)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci TABLESPACE `Contenido`;

CREATE TABLE IF NOT EXISTS galeria_institucional (
    Id    BIGINT        NOT NULL AUTO_INCREMENT,
    Title VARCHAR(500)  NOT NULL,
    Image VARCHAR(2000) NOT NULL,
    Orden INT           NOT NULL DEFAULT 1,
    PRIMARY KEY (Id)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci TABLESPACE `Contenido`;

-- Catalogo (1024 MB)

CREATE TABLE IF NOT EXISTS productos (
    Id           BIGINT         NOT NULL AUTO_INCREMENT,
    Nombre       VARCHAR(200)   NOT NULL,
    Descripcion  VARCHAR(2000)  NOT NULL,
    Imagen       VARCHAR(1000)  NOT NULL DEFAULT '',
    PrecioNormal DECIMAL(12,2)  NOT NULL,
    PrecioConIVA DECIMAL(12,2)  NOT NULL,
    Stock        INT            NOT NULL DEFAULT 0,
    Estado       VARCHAR(20)    NOT NULL DEFAULT 'Habilitado',
    Peso         VARCHAR(50)    NOT NULL DEFAULT '',
    EsDestacado  TINYINT(1)     NOT NULL DEFAULT 0,
    PRIMARY KEY (Id),
    CHECK (Estado IN ('Habilitado', 'Deshabilitado')),
    CHECK (Stock >= 0),
    CHECK (PrecioNormal >= 0)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci TABLESPACE `Catalogo`;
