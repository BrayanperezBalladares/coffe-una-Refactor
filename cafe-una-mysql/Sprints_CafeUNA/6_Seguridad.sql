-- Sprint 6: login

USE cafe_una;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

DELIMITER $$

-- Login: el backend Nest valida el JWT. Este procedimiento sirve para MySQL.
CREATE PROCEDURE sp_Usuario_Login(
    IN p_identificador VARCHAR(200),
    IN p_password VARCHAR(200)
)
BEGIN
    SELECT Id, Nombre, Correo, Estado, Roles
      FROM usuarios
     WHERE (LOWER(Correo) = LOWER(TRIM(p_identificador))
            OR LOWER(Nombre) = LOWER(TRIM(p_identificador)))
       AND PasswordHash = LOWER(SHA2(p_password, 256))
       AND Estado = 'activo';
END $$

DELIMITER ;


