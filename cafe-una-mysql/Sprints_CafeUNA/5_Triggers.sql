-- Sprint 5: triggers de auditoria y productos

USE cafe_una;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

DELIMITER $$

CREATE TRIGGER tr_Usuarios_Insert AFTER INSERT ON usuarios FOR EACH ROW
BEGIN
    CALL sp_Auditoria_Registrar(
        'INSERT', 'usuarios', CAST(NEW.Id AS CHAR),
        CONCAT('Usuario creado: ', NEW.Nombre)
    );
END $$

CREATE TRIGGER tr_Usuarios_Update AFTER UPDATE ON usuarios FOR EACH ROW
BEGIN
    IF OLD.Estado <> NEW.Estado OR OLD.Roles <> NEW.Roles OR OLD.Correo <> NEW.Correo THEN
        CALL sp_Auditoria_Registrar(
            'UPDATE', 'usuarios', CAST(NEW.Id AS CHAR),
            CONCAT(NEW.Nombre, ' | Estado: ', OLD.Estado, ' -> ', NEW.Estado)
        );
    END IF;
END $$

CREATE TRIGGER tr_Usuarios_Delete AFTER DELETE ON usuarios FOR EACH ROW
BEGIN
    CALL sp_Auditoria_Registrar(
        'DELETE', 'usuarios', CAST(OLD.Id AS CHAR),
        CONCAT('Usuario eliminado: ', OLD.Nombre)
    );
END $$

CREATE TRIGGER tr_Productos_Insert AFTER INSERT ON productos FOR EACH ROW
BEGIN
    CALL sp_Auditoria_Registrar(
        'INSERT', 'productos', CAST(NEW.Id AS CHAR),
        CONCAT('Producto creado: ', NEW.Nombre)
    );
END $$

CREATE TRIGGER tr_Productos_Update AFTER UPDATE ON productos FOR EACH ROW
BEGIN
    IF OLD.Nombre <> NEW.Nombre OR OLD.Stock <> NEW.Stock OR OLD.Estado <> NEW.Estado
       OR OLD.PrecioNormal <> NEW.PrecioNormal OR OLD.EsDestacado <> NEW.EsDestacado THEN
        CALL sp_Auditoria_Registrar(
            'UPDATE', 'productos', CAST(NEW.Id AS CHAR),
            CONCAT(NEW.Nombre, ' | Stock: ', OLD.Stock, ' -> ', NEW.Stock)
        );
    END IF;
END $$

CREATE TRIGGER tr_Productos_Delete AFTER DELETE ON productos FOR EACH ROW
BEGIN
    CALL sp_Auditoria_Registrar(
        'DELETE', 'productos', CAST(OLD.Id AS CHAR),
        CONCAT('Producto eliminado: ', OLD.Nombre)
    );
END $$

CREATE TRIGGER tr_Hero_Update AFTER UPDATE ON hero_principal FOR EACH ROW
BEGIN
    CALL sp_Auditoria_Registrar(
        'UPDATE', 'hero_principal', CAST(NEW.Id AS CHAR),
        CONCAT('Hero actualizado: ', NEW.Title)
    );
END $$

CREATE TRIGGER tr_Textos_Update AFTER UPDATE ON textos_institucionales FOR EACH ROW
BEGIN
    CALL sp_Auditoria_Registrar(
        'UPDATE', 'textos_institucionales', NEW.Clave,
        CONCAT('Texto actualizado: ', NEW.Clave)
    );
END $$

CREATE TRIGGER tr_Tarjetas_Update AFTER UPDATE ON tarjetas_inicio FOR EACH ROW
BEGIN
    CALL sp_Auditoria_Registrar(
        'UPDATE', 'tarjetas_inicio', NEW.Clave,
        CONCAT('Tarjeta actualizada: ', NEW.Clave)
    );
END $$

CREATE TRIGGER tr_Navbar_Update AFTER UPDATE ON informacion_navbar FOR EACH ROW
BEGIN
    CALL sp_Auditoria_Registrar(
        'UPDATE', 'informacion_navbar', CAST(NEW.Id AS CHAR), 'Navbar actualizado'
    );
END $$

CREATE TRIGGER tr_Footer_Update AFTER UPDATE ON informacion_footer FOR EACH ROW
BEGIN
    CALL sp_Auditoria_Registrar(
        'UPDATE', 'informacion_footer', CAST(NEW.Id AS CHAR), 'Footer actualizado'
    );
END $$

CREATE TRIGGER tr_Galeria_Insert AFTER INSERT ON galeria_institucional FOR EACH ROW
BEGIN
    CALL sp_Auditoria_Registrar(
        'INSERT', 'galeria_institucional', CAST(NEW.Id AS CHAR),
        CONCAT('Imagen agregada: ', NEW.Title)
    );
END $$

CREATE TRIGGER tr_Galeria_Update AFTER UPDATE ON galeria_institucional FOR EACH ROW
BEGIN
    CALL sp_Auditoria_Registrar(
        'UPDATE', 'galeria_institucional', CAST(NEW.Id AS CHAR),
        CONCAT('Imagen actualizada: ', NEW.Title)
    );
END $$

CREATE TRIGGER tr_Galeria_Delete AFTER DELETE ON galeria_institucional FOR EACH ROW
BEGIN
    CALL sp_Auditoria_Registrar(
        'DELETE', 'galeria_institucional', CAST(OLD.Id AS CHAR),
        CONCAT('Imagen eliminada: ', OLD.Title)
    );
END $$

CREATE TRIGGER tr_Enlaces_Insert AFTER INSERT ON enlaces_sitio FOR EACH ROW
BEGIN
    CALL sp_Auditoria_Registrar(
        'INSERT', 'enlaces_sitio', CAST(NEW.Id AS CHAR),
        CONCAT('Enlace creado: ', NEW.Etiqueta)
    );
END $$

CREATE TRIGGER tr_Enlaces_Update AFTER UPDATE ON enlaces_sitio FOR EACH ROW
BEGIN
    CALL sp_Auditoria_Registrar(
        'UPDATE', 'enlaces_sitio', CAST(NEW.Id AS CHAR),
        CONCAT('Enlace actualizado: ', NEW.Etiqueta)
    );
END $$

CREATE TRIGGER tr_Enlaces_Delete AFTER DELETE ON enlaces_sitio FOR EACH ROW
BEGIN
    CALL sp_Auditoria_Registrar(
        'DELETE', 'enlaces_sitio', CAST(OLD.Id AS CHAR),
        CONCAT('Enlace eliminado: ', OLD.Etiqueta)
    );
END $$

CREATE TRIGGER tr_Voluntariado_Update AFTER UPDATE ON solicitudes_voluntariado FOR EACH ROW
BEGIN
    IF OLD.Estado <> NEW.Estado THEN
        CALL sp_Auditoria_Registrar(
            'UPDATE', 'solicitudes_voluntariado', CAST(NEW.Id AS CHAR),
            CONCAT(IFNULL(NEW.Nombre, 'Solicitud'), ' | Estado: ', OLD.Estado, ' -> ', NEW.Estado)
        );
    END IF;
END $$

CREATE TRIGGER tr_Voluntariado_Delete AFTER DELETE ON solicitudes_voluntariado FOR EACH ROW
BEGIN
    CALL sp_Auditoria_Registrar(
        'DELETE', 'solicitudes_voluntariado', CAST(OLD.Id AS CHAR),
        CONCAT('Solicitud eliminada: ', IFNULL(OLD.Nombre, ''))
    );
END $$

CREATE TRIGGER tr_Productos_AntesInsertar
BEFORE INSERT ON productos
FOR EACH ROW
BEGIN
    SET NEW.PrecioConIVA = ROUND(NEW.PrecioNormal * 1.13, 2);

    IF NEW.EsDestacado = 1 AND (NEW.Stock <= 0 OR NEW.Estado = 'Deshabilitado') THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Un producto destacado necesita stock y estar habilitado.';
    END IF;

    IF NEW.EsDestacado = 1 AND (
        SELECT COUNT(*) FROM productos WHERE EsDestacado = 1
    ) >= 3 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Solo se permiten 3 productos destacados.';
    END IF;
END $$

CREATE TRIGGER tr_Productos_AntesActualizar
BEFORE UPDATE ON productos
FOR EACH ROW
BEGIN
    SET NEW.PrecioConIVA = ROUND(NEW.PrecioNormal * 1.13, 2);

    IF NEW.Stock <= 0 THEN
        SET NEW.EsDestacado = 0;
    END IF;

    IF NEW.EsDestacado = 1 AND NEW.Estado = 'Deshabilitado' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Quita el producto de destacados antes de deshabilitarlo.';
    END IF;

    IF NEW.EsDestacado = 1 AND OLD.EsDestacado = 0 AND (
        SELECT COUNT(*) FROM productos WHERE EsDestacado = 1 AND Id <> NEW.Id
    ) >= 3 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Solo se permiten 3 productos destacados.';
    END IF;
END $$

DELIMITER ;

