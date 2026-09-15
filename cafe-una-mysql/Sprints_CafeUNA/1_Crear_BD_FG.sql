-- Sprint 1: base de datos y filegroups (tablespaces InnoDB)


CREATE DATABASE IF NOT EXISTS cafe_una
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE cafe_una;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET time_zone = '+00:00';

DROP PROCEDURE IF EXISTS sp_recrear_filegroup;

DELIMITER //
CREATE PROCEDURE sp_recrear_filegroup(
    IN nombre VARCHAR(64),
    IN archivo VARCHAR(128),
    IN incremento VARCHAR(16)
)
BEGIN
    IF EXISTS (
        SELECT 1
          FROM information_schema.INNODB_TABLESPACES
         WHERE NAME = nombre
    ) THEN
        SET @ddl = CONCAT('DROP TABLESPACE `', nombre, '` ENGINE=InnoDB');
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;

    SET @ddl = CONCAT(
        'CREATE TABLESPACE `', nombre,
        '` ADD DATAFILE ''', archivo,
        ''' AUTOEXTEND_SIZE = ', incremento,
        ' ENGINE=InnoDB'
    );
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END //
DELIMITER ;

-- Filegroups (equivalente MySQL de FG)
CALL sp_recrear_filegroup('FG_PRIMARY',  'fg_primary.ibd',  '512M');
CALL sp_recrear_filegroup('Seguridad',   'seguridad.ibd',   '256M');
CALL sp_recrear_filegroup('Contenido',   'contenido.ibd',   '1024M');
CALL sp_recrear_filegroup('Catalogo',    'catalogo.ibd',    '1024M');
CALL sp_recrear_filegroup('Operaciones', 'operaciones.ibd', '1024M');


