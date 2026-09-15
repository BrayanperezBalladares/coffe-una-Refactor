-- Sprint 3: procedimientos CRUD

USE cafe_una;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

DELIMITER $$

CREATE PROCEDURE sp_Usuario_Insertar(
    IN p_nombre VARCHAR(200),
    IN p_correo VARCHAR(200),
    IN p_password VARCHAR(200),
    IN p_roles TEXT,
    IN p_estado VARCHAR(20)
)
BEGIN
    INSERT INTO usuarios (Nombre, Correo, PasswordHash, Estado, Roles)
    VALUES (
        TRIM(p_nombre),
        LOWER(TRIM(p_correo)),
        LOWER(SHA2(p_password, 256)),
        IFNULL(p_estado, 'activo'),
        p_roles
    );
    SELECT LAST_INSERT_ID() AS Id;
END $$

CREATE PROCEDURE sp_Usuario_Actualizar(
    IN p_id INT,
    IN p_nombre VARCHAR(200),
    IN p_correo VARCHAR(200),
    IN p_roles TEXT,
    IN p_estado VARCHAR(20)
)
BEGIN
    UPDATE usuarios
       SET Nombre = TRIM(p_nombre),
           Correo = LOWER(TRIM(p_correo)),
           Roles = p_roles,
           Estado = p_estado
     WHERE Id = p_id;
END $$

CREATE PROCEDURE sp_Usuario_CambiarEstado(IN p_id INT, IN p_estado VARCHAR(20))
BEGIN
    UPDATE usuarios SET Estado = p_estado WHERE Id = p_id;
END $$

CREATE PROCEDURE sp_Usuario_Obtener(IN p_id INT)
BEGIN
    SELECT Id, Nombre, Correo, Estado, Roles, FotoPerfilUrl, FotoBannerUrl
      FROM usuarios
     WHERE Id = p_id;
END $$

CREATE PROCEDURE sp_Producto_Insertar(
    IN p_nombre VARCHAR(200),
    IN p_descripcion VARCHAR(2000),
    IN p_imagen VARCHAR(1000),
    IN p_precio DECIMAL(12,2),
    IN p_stock INT,
    IN p_peso VARCHAR(50),
    IN p_destacado TINYINT,
    IN p_estado VARCHAR(20)
)
BEGIN
    INSERT INTO productos (
        Nombre, Descripcion, Imagen, PrecioNormal, PrecioConIVA,
        Stock, Estado, Peso, EsDestacado
    ) VALUES (
        TRIM(p_nombre),
        TRIM(p_descripcion),
        IFNULL(p_imagen, ''),
        p_precio,
        ROUND(p_precio * 1.13, 2),
        p_stock,
        IFNULL(p_estado, 'Habilitado'),
        IFNULL(p_peso, ''),
        IFNULL(p_destacado, 0)
    );
    SELECT LAST_INSERT_ID() AS Id;
END $$

CREATE PROCEDURE sp_Producto_Actualizar(
    IN p_id BIGINT,
    IN p_nombre VARCHAR(200),
    IN p_descripcion VARCHAR(2000),
    IN p_imagen VARCHAR(1000),
    IN p_precio DECIMAL(12,2),
    IN p_stock INT,
    IN p_peso VARCHAR(50),
    IN p_destacado TINYINT,
    IN p_estado VARCHAR(20)
)
BEGIN
    UPDATE productos
       SET Nombre = TRIM(p_nombre),
           Descripcion = TRIM(p_descripcion),
           Imagen = IFNULL(p_imagen, Imagen),
           PrecioNormal = p_precio,
           PrecioConIVA = ROUND(p_precio * 1.13, 2),
           Stock = p_stock,
           Peso = IFNULL(p_peso, Peso),
           EsDestacado = p_destacado,
           Estado = p_estado
     WHERE Id = p_id;
END $$

CREATE PROCEDURE sp_Hero_Guardar(
    IN p_eyebrow VARCHAR(200),
    IN p_title VARCHAR(500),
    IN p_subtitle VARCHAR(1000),
    IN p_primary_text VARCHAR(200),
    IN p_primary_url VARCHAR(500),
    IN p_button_text VARCHAR(200),
    IN p_button_url VARCHAR(500),
    IN p_background VARCHAR(2000)
)
BEGIN
    INSERT INTO hero_principal (
        Id, Eyebrow, Title, Subtitle, PrimaryButtonText, PrimaryButtonUrl,
        ButtonText, ButtonUrl, BackgroundImage
    ) VALUES (
        1, p_eyebrow, p_title, p_subtitle, p_primary_text, p_primary_url,
        p_button_text, p_button_url, p_background
    )
    ON DUPLICATE KEY UPDATE
        Eyebrow = VALUES(Eyebrow),
        Title = VALUES(Title),
        Subtitle = VALUES(Subtitle),
        PrimaryButtonText = VALUES(PrimaryButtonText),
        PrimaryButtonUrl = VALUES(PrimaryButtonUrl),
        ButtonText = VALUES(ButtonText),
        ButtonUrl = VALUES(ButtonUrl),
        BackgroundImage = VALUES(BackgroundImage);
END $$

CREATE PROCEDURE sp_Texto_Guardar(
    IN p_clave VARCHAR(50),
    IN p_eyebrow VARCHAR(200),
    IN p_title VARCHAR(500),
    IN p_description VARCHAR(4000),
    IN p_image VARCHAR(1000),
    IN p_link_url VARCHAR(1000),
    IN p_link_text VARCHAR(200)
)
BEGIN
    INSERT INTO textos_institucionales (
        Clave, Eyebrow, Title, Description, Image, LinkUrl, LinkText
    ) VALUES (
        p_clave, p_eyebrow, p_title, p_description, p_image, p_link_url, p_link_text
    )
    ON DUPLICATE KEY UPDATE
        Eyebrow = VALUES(Eyebrow),
        Title = VALUES(Title),
        Description = VALUES(Description),
        Image = VALUES(Image),
        LinkUrl = VALUES(LinkUrl),
        LinkText = VALUES(LinkText);
END $$

CREATE PROCEDURE sp_Tarjeta_Guardar(
    IN p_clave VARCHAR(50),
    IN p_etiqueta VARCHAR(100),
    IN p_titulo VARCHAR(300),
    IN p_descripcion VARCHAR(2000),
    IN p_ruta VARCHAR(300),
    IN p_boton VARCHAR(200),
    IN p_orden INT
)
BEGIN
    INSERT INTO tarjetas_inicio (
        Clave, Etiqueta, Titulo, Descripcion, Ruta, TextoBoton, Orden
    ) VALUES (
        p_clave, p_etiqueta, p_titulo, p_descripcion, p_ruta, p_boton, p_orden
    )
    ON DUPLICATE KEY UPDATE
        Etiqueta = VALUES(Etiqueta),
        Titulo = VALUES(Titulo),
        Descripcion = VALUES(Descripcion),
        Ruta = VALUES(Ruta),
        TextoBoton = VALUES(TextoBoton),
        Orden = VALUES(Orden);
END $$

CREATE PROCEDURE sp_Navbar_Guardar(IN p_logo VARCHAR(1000), IN p_logo_claro VARCHAR(1000))
BEGIN
    INSERT INTO informacion_navbar (Id, LogoUrl, LogoClaroUrl)
    VALUES (1, p_logo, p_logo_claro)
    ON DUPLICATE KEY UPDATE
        LogoUrl = VALUES(LogoUrl),
        LogoClaroUrl = VALUES(LogoClaroUrl);
END $$

CREATE PROCEDURE sp_Footer_Guardar(
    IN p_logo VARCHAR(1000),
    IN p_logo_claro VARCHAR(1000),
    IN p_frase VARCHAR(500),
    IN p_telefono VARCHAR(50),
    IN p_correo VARCHAR(200),
    IN p_facebook VARCHAR(500),
    IN p_instagram VARCHAR(500),
    IN p_maps VARCHAR(2000),
    IN p_copyright VARCHAR(500)
)
BEGIN
    INSERT INTO informacion_footer (
        Id, LogoUrl, LogoClaroUrl, FraseMarca, Telefono, Correo,
        FacebookUrl, InstagramUrl, MapsUrl, TextoCopyright
    ) VALUES (
        1, p_logo, p_logo_claro, p_frase, p_telefono, p_correo,
        p_facebook, p_instagram, p_maps, p_copyright
    )
    ON DUPLICATE KEY UPDATE
        LogoUrl = VALUES(LogoUrl),
        LogoClaroUrl = VALUES(LogoClaroUrl),
        FraseMarca = VALUES(FraseMarca),
        Telefono = VALUES(Telefono),
        Correo = VALUES(Correo),
        FacebookUrl = VALUES(FacebookUrl),
        InstagramUrl = VALUES(InstagramUrl),
        MapsUrl = VALUES(MapsUrl),
        TextoCopyright = VALUES(TextoCopyright);
END $$

CREATE PROCEDURE sp_Enlace_Insertar(
    IN p_etiqueta VARCHAR(200),
    IN p_ruta VARCHAR(500),
    IN p_seccion VARCHAR(100),
    IN p_orden INT,
    IN p_nueva_pestana TINYINT
)
BEGIN
    INSERT INTO enlaces_sitio (Etiqueta, Ruta, Seccion, Orden, AbrirEnNuevaPestana)
    VALUES (p_etiqueta, p_ruta, p_seccion, p_orden, IFNULL(p_nueva_pestana, 0));
END $$

CREATE PROCEDURE sp_Galeria_Insertar(
    IN p_title VARCHAR(500),
    IN p_image VARCHAR(2000),
    IN p_orden INT
)
BEGIN
    INSERT INTO galeria_institucional (Title, Image, Orden)
    VALUES (p_title, p_image, p_orden);
END $$

CREATE PROCEDURE sp_Voluntariado_Insertar(
    IN p_user_id VARCHAR(100),
    IN p_fecha VARCHAR(20),
    IN p_nombre VARCHAR(200),
    IN p_email VARCHAR(200),
    IN p_telefono VARCHAR(50),
    IN p_tipo VARCHAR(100),
    IN p_descripcion VARCHAR(2000),
    IN p_motivacion VARCHAR(2000)
)
BEGIN
    INSERT INTO solicitudes_voluntariado (
        UserId, FechaSolicitud, Estado, Nombre, Email, Telefono,
        TipoVoluntariado, Descripcion, Motivacion
    ) VALUES (
        p_user_id, p_fecha, 'Pendiente', p_nombre, p_email, p_telefono,
        p_tipo, p_descripcion, p_motivacion
    );
END $$

CREATE PROCEDURE sp_Auditoria_Registrar(
    IN p_accion VARCHAR(50),
    IN p_tabla VARCHAR(80),
    IN p_id_registro VARCHAR(50),
    IN p_detalle VARCHAR(500)
)
BEGIN
    INSERT INTO auditoria (Accion, Tabla, IdRegistro, Detalle, Fecha, IdUsuario)
    VALUES (
        p_accion,
        p_tabla,
        p_id_registro,
        IFNULL(p_detalle, CONCAT(p_accion, ' en ', p_tabla)),
        UTC_TIMESTAMP(),
        @auditoria_usuario_id
    );
END $$

DELIMITER ;
