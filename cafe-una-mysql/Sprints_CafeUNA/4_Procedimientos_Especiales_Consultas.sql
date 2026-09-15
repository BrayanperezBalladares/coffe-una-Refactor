-- Sprint 4: consultas

USE cafe_una;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

DELIMITER $$

CREATE PROCEDURE sp_Permisos_PorRol(IN p_rol VARCHAR(30))
BEGIN
    SELECT p.Codigo, p.Nombre
      FROM roles r
      INNER JOIN rol_permisos rp ON rp.IdRol = r.Id
      INNER JOIN permisos p ON p.Id = rp.IdPermiso
     WHERE r.Nombre = p_rol
     ORDER BY p.Nombre;
END $$

CREATE PROCEDURE sp_Inicio_Hero()
BEGIN
    SELECT * FROM hero_principal WHERE Id = 1;
END $$

CREATE PROCEDURE sp_Productos_Catalogo()
BEGIN
    SELECT Id, Nombre, Descripcion, Imagen, PrecioNormal, PrecioConIVA,
           Stock, Estado, Peso, EsDestacado
      FROM productos
     WHERE Estado = 'Habilitado'
     ORDER BY Id;
END $$

CREATE PROCEDURE sp_Productos_Destacados()
BEGIN
    SELECT Id, Nombre, Descripcion, Imagen, PrecioNormal, PrecioConIVA,
           Stock, Estado, Peso, EsDestacado
      FROM productos
     WHERE EsDestacado = 1
       AND Estado = 'Habilitado'
       AND Stock > 0
     ORDER BY Id
     LIMIT 3;
END $$

CREATE PROCEDURE sp_Usuarios_Admin()
BEGIN
    SELECT Id, Nombre, Correo, Estado, Roles, FotoPerfilUrl, FotoBannerUrl
      FROM usuarios
     ORDER BY Id;
END $$

CREATE PROCEDURE sp_Auditoria_Listar()
BEGIN
    SELECT a.Id, a.Accion, a.Tabla, a.IdRegistro, a.Detalle, a.Fecha, u.Nombre AS Usuario
      FROM auditoria a
      LEFT JOIN usuarios u ON u.Id = a.IdUsuario
     ORDER BY a.Id DESC;
END $$

DELIMITER ;


