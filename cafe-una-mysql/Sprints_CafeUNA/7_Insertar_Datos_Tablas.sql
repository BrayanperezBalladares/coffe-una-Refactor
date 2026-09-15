-- Sprint 7: datos iniciales con tildes (utf8mb4). Contraseña de prueba: CafeUna2026!

USE cafe_una;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Roles y permisos

INSERT IGNORE INTO roles (Nombre) VALUES
  ('SuperAdmin'),
  ('Admin'),
  ('Vendedor'),
  ('Cliente'),
  ('Usuario'),
  ('Visitante');

INSERT IGNORE INTO permisos (Codigo, Nombre) VALUES
  ('ver_informacion', 'Ver información'),
  ('agregar_imagenes_galeria', 'Agregar imágenes a galería de fotos'),
  ('actualizar_informacion', 'Actualizar información'),
  ('inactivar_informacion', 'Inactivar información'),
  ('ver_panel_administrativo', 'Ver panel administrativo'),
  ('crear_usuarios', 'Crear usuarios'),
  ('editar_usuarios', 'Editar usuarios'),
  ('inactivar_usuarios', 'Inactivar usuarios'),
  ('asignar_roles', 'Asignar roles'),
  ('administrar_roles_permisos', 'Administrar roles y permisos'),
  ('actualizar_perfil_propio', 'Actualizar perfil propio'),
  ('cambiar_contrasena_propia', 'Cambiar contraseña propia'),
  ('ver_perfil_propio', 'Ver perfil propio'),
  ('ver_panel_usuario_propio', 'Ver panel de usuario propio'),
  ('registrar_ventas', 'Registrar ventas'),
  ('actualizar_ventas', 'Actualizar ventas'),
  ('ver_ventas', 'Ver ventas'),
  ('cancelar_ventas', 'Cancelar ventas'),
  ('ver_reportes', 'Ver reportes'),
  ('ver_productos', 'Ver productos'),
  ('crear_productos', 'Crear productos'),
  ('comprar_productos', 'Comprar productos'),
  ('actualizar_stock_productos', 'Actualizar stock de productos'),
  ('actualizar_productos', 'Actualizar productos'),
  ('inactivar_productos', 'Inactivar productos'),
  ('ver_historial_compras_clientes', 'Ver historial de compras de clientes'),
  ('ver_historial_compras_propio', 'Ver historial de compras propio'),
  ('ver_inventario', 'Ver inventario'),
  ('actualizar_inventario', 'Actualizar inventario'),
  ('agregar_articulo_inventario', 'Agregar artículo de inventario'),
  ('inactivar_articulo_inventario', 'Inactivar artículo de inventario'),
  ('ver_productores', 'Ver productores'),
  ('administrar_solicitudes_productores', 'Administrar solicitudes de productores'),
  ('agregar_productor', 'Agregar productor'),
  ('actualizar_productor', 'Actualizar productor'),
  ('inactivar_productor', 'Inactivar productor'),
  ('ver_todas_las_facturas', 'Ver todas las facturas'),
  ('crear_facturas_hacienda', 'Crear facturas hacienda'),
  ('ver_factura_propia', 'Ver factura propia'),
  ('crear_su_propia_factura', 'Crear su propia factura'),
  ('actualizar_facturas', 'Actualizar facturas'),
  ('descargar_su_propia_factura', 'Descargar su propia factura'),
  ('descargar_facturas', 'Descargar facturas'),
  ('inactivar_facturas', 'Inactivar facturas'),
  ('ver_documentacion_visible', 'Ver documentación visible'),
  ('ver_documentacion_privada', 'Ver documentación privada'),
  ('crear_documentacion', 'Crear documentación'),
  ('actualizar_documentacion', 'Actualizar documentación'),
  ('administrar_solicitudes_documentacion', 'Administrar solicitudes de documentación'),
  ('inactivar_documentacion', 'Inactivar documentación'),
  ('administrar_solicitudes_visitantes', 'Administrar solicitudes de visitantes'),
  ('crear_solicitud_visitante', 'Crear solicitud de visitante'),
  ('actualizar_visitas', 'Actualizar visitas'),
  ('inactivar_visita', 'Inactivar visita'),
  ('ver_solicitudes_voluntariado', 'Ver solicitudes de voluntariado'),
  ('ingresar_solicitud_voluntariado', 'Ingresar una solicitud de voluntariado'),
  ('administrar_solicitudes_voluntariado', 'Administrar solicitudes de voluntariado'),
  ('actualizar_solicitud_voluntariado', 'Actualizar una solicitud de voluntariado'),
  ('inactivar_voluntariado', 'Inactivar voluntariado'),
  ('ver_solicitudes_donacion', 'Ver solicitudes de donación'),
  ('hacer_solicitud_donacion', 'Hacer solicitud de donación'),
  ('administrar_solicitudes_donaciones', 'Administrar solicitud de donaciones'),
  ('actualizar_solicitud_donaciones', 'Actualizar solicitud de donaciones'),
  ('inactivar_donacion', 'Inactivar donación'),
  ('ver_auditoria', 'Ver auditoría');

INSERT IGNORE INTO rol_permisos (IdRol, IdPermiso)
SELECT r.Id, p.Id FROM roles r CROSS JOIN permisos p
 WHERE r.Nombre = 'SuperAdmin'
   AND p.Codigo NOT IN ('comprar_productos', 'ver_historial_compras_propio');

INSERT IGNORE INTO rol_permisos (IdRol, IdPermiso)
SELECT r.Id, p.Id FROM roles r CROSS JOIN permisos p
 WHERE r.Nombre = 'Admin'
   AND p.Codigo IN (
     'ver_informacion', 'agregar_imagenes_galeria', 'actualizar_informacion', 'inactivar_informacion',
     'ver_panel_administrativo', 'actualizar_perfil_propio', 'cambiar_contrasena_propia',
     'ver_perfil_propio', 'ver_panel_usuario_propio', 'registrar_ventas', 'actualizar_ventas',
     'ver_ventas', 'cancelar_ventas', 'ver_reportes', 'ver_productos', 'actualizar_stock_productos',
     'actualizar_productos', 'inactivar_productos', 'ver_historial_compras_clientes',
     'ver_inventario', 'actualizar_inventario', 'agregar_articulo_inventario', 'inactivar_articulo_inventario',
     'ver_productores', 'administrar_solicitudes_productores', 'agregar_productor',
     'ver_todas_las_facturas', 'crear_facturas_hacienda', 'ver_factura_propia', 'crear_su_propia_factura',
     'actualizar_facturas', 'descargar_su_propia_factura', 'descargar_facturas', 'inactivar_facturas',
     'ver_documentacion_visible', 'ver_documentacion_privada', 'crear_documentacion', 'actualizar_documentacion',
     'administrar_solicitudes_documentacion', 'administrar_solicitudes_visitantes', 'crear_solicitud_visitante',
     'ver_solicitudes_voluntariado', 'ingresar_solicitud_voluntariado', 'administrar_solicitudes_voluntariado',
     'ver_solicitudes_donacion', 'hacer_solicitud_donacion', 'administrar_solicitudes_donaciones', 'inactivar_donacion'
   );

INSERT IGNORE INTO rol_permisos (IdRol, IdPermiso)
SELECT r.Id, p.Id FROM roles r CROSS JOIN permisos p
 WHERE r.Nombre = 'Vendedor'
   AND p.Codigo IN (
     'ver_informacion', 'ver_panel_administrativo', 'actualizar_perfil_propio', 'cambiar_contrasena_propia',
     'ver_perfil_propio', 'ver_panel_usuario_propio', 'registrar_ventas', 'actualizar_ventas', 'ver_ventas',
     'cancelar_ventas', 'ver_reportes', 'ver_productos', 'actualizar_stock_productos',
     'ver_historial_compras_clientes', 'ver_productores', 'ver_todas_las_facturas', 'crear_facturas_hacienda',
     'ver_factura_propia', 'crear_su_propia_factura', 'actualizar_facturas', 'descargar_su_propia_factura',
     'descargar_facturas', 'inactivar_facturas', 'ver_documentacion_visible', 'crear_solicitud_visitante',
     'ingresar_solicitud_voluntariado', 'hacer_solicitud_donacion'
   );

INSERT IGNORE INTO rol_permisos (IdRol, IdPermiso)
SELECT r.Id, p.Id FROM roles r CROSS JOIN permisos p
 WHERE r.Nombre = 'Cliente'
   AND p.Codigo IN (
     'ver_informacion', 'actualizar_perfil_propio', 'cambiar_contrasena_propia', 'ver_perfil_propio',
     'ver_panel_usuario_propio', 'ver_productos', 'comprar_productos', 'ver_historial_compras_propio',
     'ver_productores', 'descargar_su_propia_factura', 'ver_documentacion_visible', 'crear_solicitud_visitante',
     'ingresar_solicitud_voluntariado', 'hacer_solicitud_donacion'
   );

INSERT IGNORE INTO rol_permisos (IdRol, IdPermiso)
SELECT r.Id, p.Id FROM roles r CROSS JOIN permisos p
 WHERE r.Nombre = 'Usuario'
   AND p.Codigo IN (
     'ver_informacion', 'actualizar_perfil_propio', 'cambiar_contrasena_propia', 'ver_perfil_propio',
     'ver_panel_usuario_propio', 'ver_productos', 'ver_productores', 'ver_documentacion_visible',
     'crear_solicitud_visitante', 'ingresar_solicitud_voluntariado', 'hacer_solicitud_donacion'
   );

INSERT IGNORE INTO rol_permisos (IdRol, IdPermiso)
SELECT r.Id, p.Id FROM roles r CROSS JOIN permisos p
 WHERE r.Nombre = 'Visitante'
   AND p.Codigo IN (
     'ver_informacion', 'ver_productos', 'ver_productores', 'ver_documentacion_visible'
   );

-- Usuarios (18 cuentas)

INSERT IGNORE INTO usuarios (Id, Nombre, Correo, PasswordHash, Estado, Roles, FotoPerfilUrl, FotoBannerUrl, FotoPerfilPosicion, FotoBannerPosicion) VALUES
(1, 'SuperAdmin', 'cafeunateaming@gmail.com', '$2b$12$apMdSqqTi1K2Rn3Cdnh8leiS4XoRwDsd7qXFbgllhnXJbyoQ99zF2', 'activo', '["SuperAdmin"]',
 'https://i.ibb.co/gbQgcRq3/Captura-de-pantalla-2026-06-15-011218.webp',
 'https://scontent.fsjo10-1.fna.fbcdn.net/v/t39.30808-6/487732157_1300331155029373_2476619626096466640_n.jpg?stp=dst-jpg_tt6&cstp=mx1280x960&ctp=s960x960&_nc_cat=101&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=p7hfOvq-uV0Q7kNvwFwOF_C&_nc_oc=AdpXULI6SX7LojGIaZs-ZagNF5qxNphJq6J1oQ-xvjgvPPwA4wK84kvRZAwzel4-WNU&_nc_zt=23&_nc_ht=scontent.fsjo10-1.fna&_nc_gid=RYtvqORWZzKczwirkL1Mzw&_nc_ss=7b2a8&oh=00_Af9wy6Dlj3oEHmFErzMtXaOVcQIb7sKTc10TEYWJsuKW-A&oe=6A3651DA',
 '79% 60%', '57% 86%'),
(2, 'Admin', 'marimar20062510@gmail.com', '$2b$12$g4WBNLE6DLOQLKSk2yH57.vv1h9VTHXUokxp09Dlvw8I9DXxM5xom', 'activo', '["Admin"]', NULL, NULL, NULL, NULL),
(3, 'Vendedor', 'vendedor@cafeuna.local', '0af651b6352f280cb9706f19c78bc3fc646ce33420e250a76594139b65b4c81a', 'activo', '["Vendedor"]', NULL, NULL, NULL, NULL),
(4, 'Cliente', 'ilovejdg2@gmail.com', '$2b$12$dARrUPoBfayu6/7KsNu.SeDRQ/1C1OOdRDvd0k2XIbMrdn/RRLtVS', 'activo', '["Cliente"]', NULL, NULL, NULL, NULL),
(5, 'Usuario', 'mariadelmardiaz379@gmail.com', '$2b$12$bqe/lEH2ggigf.wc1hG7Ce.kb1GGznxCh6sMWKEnWO894YRUHYhmm', 'activo', '["Usuario"]', NULL, NULL, NULL, NULL),
(6, 'Maria', 'maria@cafeuna.local', '0af651b6352f280cb9706f19c78bc3fc646ce33420e250a76594139b65b4c81a', 'activo', '["SuperAdmin"]', NULL, NULL, NULL, NULL),
(7, 'José', 'josealbertod247@gmail.com', '$2b$12$Vs8oidTVg64BYg9u43yeSONHqr6fbrnaZC.ACP7e7RKC14hPHkwEi', 'activo', '["Usuario"]',
 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtnGyieOFJHkTfxOqSHY_Hm0N3qHXmfeks-W4ADO9P2Z_7fI7B-UtC_SbQi0yXckyvBifcZ-vUte314ztpVZEauVsFy95wF_j3gw8n3g&s=10',
 'https://i.ytimg.com/vi/Ct5GtcNpd-k/maxresdefault.jpg', NULL, '85% 100%'),
(8, 'Fatima', 'fatima.carrillo.garcia@est.una.ac.cr', '$2b$12$yET0Jy1NVSfMRhTPA9UwS.6jXxTdg8q4EJof/0VQeW6uBJJ7sNuCK', 'activo', '["SuperAdmin"]', NULL, NULL, NULL, NULL),
(9, 'Yeisson', 'yeissonalberto14@gmail.com', '$2b$12$wl/kkhF2ahnj24K8ORGlK.GotuWwLI52YQU4USQREWnZAuYfd4i4K', 'activo', '["SuperAdmin"]',
 'https://scontent.fsjo7-1.fna.fbcdn.net/v/t39.30808-6/479902119_1361469374878712_8630771672741319136_n.jpg?stp=dst-jpg_tt6&cstp=mx960x958&ctp=s960x958&_nc_cat=111&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=PXD2MJiMZuYQ7kNvwGAkKRt&_nc_oc=Adpl83Zyejx2Wtm4yQF7FemK5L4D5KKlQRW_O0a6tTOHu6iAmEzNYFXzbqWrlZYP7Fg&_nc_zt=23&_nc_ht=scontent.fsjo7-1.fna&_nc_gid=0doPugOi6CRJXkdjqUlN7Q&_nc_ss=7b2a8&oh=00_Af955Jt0ZP6zO9JvMX7A48KptQ8-Y4Q_UlgOhPzHZwCKXw&oe=6A36622C',
 NULL, '50% 50%', NULL),
(10, 'Samir', 'samir@cafeuna.local', '0af651b6352f280cb9706f19c78bc3fc646ce33420e250a76594139b65b4c81a', 'activo', '["SuperAdmin"]', NULL, NULL, NULL, NULL),
(11, 'David', 'ivozhy@gmail.com', '$2b$12$txdLe9wWWsa3ub0XCH15UufGwJUHdmaQT7VsZC8RjcOlTyXaz5goO', 'activo', '["Usuario"]', NULL, NULL, NULL, NULL),
(12, 'Elián CFG', 'eliancfg.fajardo@gmail.com', '$2b$12$2aV/GAMKP45mUHzTKFnG9uPzZ3SsIN7SiK6VTzUBTMZcwaBfVCGsm', 'activo', '["Usuario"]', NULL, NULL, NULL, NULL),
(13, 'Angel', 'angelutpx@gmail.com', '$2b$12$d2qD4QotSt9c4lUCogQmgOkZXK.GcjFOq1P3I0nsUIonRqxjnc5PK', 'inactivo', '["Usuario"]',
 'https://preview.redd.it/tears-on-a-withered-flower-can-someone-explain-to-me-about-v0-h8yvlprmk95e1.png?width=1276&format=png&auto=webp&s=fde253a621e820d97f946368791ffec91021806c',
 NULL, '64% 5%', NULL),
(14, 'Ronald Sánchez', 'ronald.sanchez.brenes@una.cr', '$2b$12$DIJks/PZRtbFm4i4gmjB1uRWRUtlyrT9EeQLrL.aGYK3BdOaju1Ba', 'activo', '["SuperAdmin"]', NULL, NULL, NULL, NULL),
(15, 'Carmen', 'carmen@cafeuna.local', '0af651b6352f280cb9706f19c78bc3fc646ce33420e250a76594139b65b4c81a', 'activo', '["Usuario","Cliente"]', NULL, NULL, NULL, NULL),
(16, 'MDM', 'maria.diaz.ruiz@est.una.ac.cr', '$2b$12$WmnwcLFcOFV499vSTiz4QuOn8rE6yrZ9fI4aOka12GQtat8IjWhjm', 'activo', '["SuperAdmin"]',
 'https://scontent.fsjo10-1.fna.fbcdn.net/v/t39.30808-6/540531194_1214486813817414_8272411006517029516_n.jpg?stp=dst-jpg_tt6&cstp=mx1366x2048&ctp=p526x296&_nc_cat=103&ccb=1-7&_nc_sid=f727a1&_nc_ohc=BBXvUmqQ6AEQ7kNvwG4rQK-&_nc_oc=AdoSSMUizZaQ2lm1rX0YoesR-kKsEgFC4LZAWdP7l1vxtqThqOUMlL_Jf4YgRfVYiio&_nc_zt=23&_nc_ht=scontent.fsjo10-1.fna&_nc_gid=0AUsOBl9ZzG9HlA70D_eCg&_nc_ss=7b2a8&oh=00_Af952bPBmU9Z_fXwxb3GrqPVKw3cW_x7jEGrQuGmihF-TA&oe=6A362A80',
 'https://scontent.fsjo10-1.fna.fbcdn.net/v/t51.82787-15/607515726_18098010262879146_4692068066196483998_n.jpg?stp=dst-jpegr_tt6&cstp=mx1440x1920&ctp=s1440x1920&_nc_cat=108&ccb=1-7&_nc_sid=127cfc&_nc_ohc=pgPoixRD5u0Q7kNvwHExpQR&_nc_oc=AdolM7IiNaLOeG7XCHiVImsau6GywHL2_bWRn9BEcoh_xDLwm4RCCxHahhooPuLoRHM&_nc_zt=23&se=-1&_nc_ht=scontent.fsjo10-1.fna&_nc_gid=EsK9mk6dHCOhAwAoDEmohg&_nc_ss=7b2a8&oh=00_Af9eNIHujdY63TZnSya49jGuuuy6o2yyJ9ybH1XsWqc3nQ&oe=6A3651A2',
 '82% 9%', '89% 44%'),
(17, 'Yami', 'yruizgonzlez@yahoo.com', '$2b$12$cd4H.Pe3ojj6otFydyfQ7OygcXmTfv417uDPBJylyR/JVhkN.WRJe', 'activo', '["Usuario","Cliente"]', NULL, NULL, NULL, NULL),
(18, 'Samcocho', 'samir.campos.diaz@est.una.ac.cr', '$2b$12$DeZdi.jZ/NtqjO5LO1RJh.Kub/6Z/UoJiSg9UDZ7U.hJcnD0UPBq.', 'activo', '["SuperAdmin"]', NULL, NULL, NULL, NULL);

-- Contenido del sitio

INSERT IGNORE INTO hero_principal (Id, Eyebrow, Title, Subtitle, PrimaryButtonText, PrimaryButtonUrl, ButtonText, ButtonUrl, BackgroundImage) VALUES
(1, 'Artesanal & orgánico', 'El mejor café para el universitario', 'Ven a deleitarte con este café tan espectacular',
 'Ver productos', '/productos', 'Conócenos', '/AboutUs',
 'https://scontent.fsjo10-1.fna.fbcdn.net/v/t39.30808-6/728555734_1705286574533827_8444639169449344865_n.jpg');

INSERT IGNORE INTO textos_institucionales (Clave, Eyebrow, Title, Description, Image, LinkUrl, LinkText) VALUES
('historia', NULL, 'Historia',
 'Café UNA, más de una década de tradición, calidad y sostenibilidad. ¡Disfruta el auténtico sabor de Costa Rica!\nEste café es producido por la Escuela de Ciencias Agrarias de la Universidad Nacional (ECA-UNA). Tiene un empaque diseñado por Arturo Rodríguez Segura, egresado de la Escuela de Arte y Comunicación Visual. Este diseño representa a Heredia como ciudad universitaria, con sus verdes montañas y cafetales, donde se produce el aromático café por manos de estudiantes, docentes y personas trabajadoras del campo, con un alto contenido de responsabilidad ambiental y social.',
 NULL, NULL, NULL),
('mission', NULL, 'Misión', 'Lograr que la gente se enamore del café', NULL, NULL, NULL),
('vision', NULL, 'Visión', 'Tenemos la visión de que en unos años esto triunfará', NULL, NULL, NULL),
('homeSpotlight', NULL, 'Conocé más sobre Café UNA',
 'Descubrí nuestra historia, propósito y el impacto que construimos junto a productores locales y la comunidad universitaria.',
 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=80', '/AboutUs', 'Conoce nuestra historia completa'),
('homeFeatured', NULL, 'Descubrí nuestra selección de cafés',
 'Explorá todos nuestros productos y elegí el café que mejor encaje con tu gusto, tu rutina y tu forma de disfrutarlo.',
 NULL, '/productos', 'Conocé nuestro catálogo'),
('homeIniciativas', 'Participá con nosotros', 'Cada aporte, visita o colaboración deja una huella especial.',
 'Elegí cómo querés involucrarte con el Café UNA y completá el formulario correspondiente.', NULL, NULL, NULL),
('homeLocation', 'Nuestra ubicación', 'Visítanos en la Finca Experimental Santa Lucía',
 'Estamos en Heredia, Barva. Ábrilo en Google Maps para ver la ruta y llegar con facilidad.', NULL,
 'https://www.google.com/maps/place/Finca+Experimental+Santa+Luc%C3%ADa+-+Universidad+Nacional/@10.0232398,-84.11705,17z/data=!4m14!1m7!3m6!1s0x8fa0faa5f69f073d:0x656b2da8f85723be!2sFinca+Experimental+Santa+Luc%C3%ADa+-+Universidad+Nacional!8m2!3d10.0232346!4d-84.1121791!16s%2Fg%2F1pp2tywc7!3m5!1s0x8fa0faa5f69f073d:0x656b2da8f85723be!8m2!3d10.0232346!4d-84.1121791!16s%2Fg%2F1pp2tywc7?entry=ttu',
 'Ver en Google Maps');

INSERT IGNORE INTO tarjetas_inicio (Clave, Etiqueta, Titulo, Descripcion, Ruta, TextoBoton, Orden) VALUES
('donaciones', 'Donaciones', 'Cada aporte transforma una vida',
 'Tu contribución financia iniciativas sostenibles, investigaciones y programas de bienestar que impactan a toda la comunidad universitaria.',
 NULL, 'Formulario', 1),
('visitas', 'Visitas', 'Conocé el corazón del proyecto',
 'Agendá una visita guiada a nuestras instalaciones y viví de cerca la experiencia del Café UNA, sus cultivos y su gente.',
 NULL, 'Formulario', 2),
('voluntariado', 'Voluntariado', 'Sumá tu energía a nuestra misión',
 'Formá parte del equipo de voluntarios que sostiene las actividades del Café UNA. Tu tiempo y dedicación dejan huella.',
 '/voluntariado/solicitar', 'Formulario', 3);

INSERT IGNORE INTO informacion_navbar (Id, LogoUrl, LogoClaroUrl) VALUES
(1, 'https://i.ibb.co/VpkqtVrY/LOGOTIPO-CAFE-UNA-CAFE-ROJO-2.webp', 'https://i.ibb.co/cstTcyr/LOGOTIPO-CAFE-UNA-BLANCO-ROJO-2.webp');

INSERT IGNORE INTO informacion_footer (Id, LogoUrl, LogoClaroUrl, FraseMarca, Telefono, Correo, FacebookUrl, InstagramUrl, MapsUrl, TextoCopyright) VALUES
(1, 'https://i.ibb.co/VpkqtVrY/LOGOTIPO-CAFE-UNA-CAFE-ROJO-2.webp', 'https://i.ibb.co/cstTcyr/LOGOTIPO-CAFE-UNA-BLANCO-ROJO-2.webp',
 'Un despertar al placer sensorial', '84848693', 'cafeuna@una.cr',
 'https://www.facebook.com/profile.php?id=100051575025767', 'https://www.instagram.com/cafeuna_',
 'https://www.google.com/maps/place/Finca+Experimental+Santa+Luc%C3%ADa+-+Universidad+Nacional/@10.0232398,-84.11705,17z/data=!4m14!1m7!3m6!1s0x8fa0faa5f69f073d:0x656b2da8f85723be!2sFinca+Experimental+Santa+Luc%C3%ADa+-+Universidad+Nacional!8m2!3d10.0232346!4d-84.1121791!16s%2Fg%2F1pp2tywc7!3m5!1s0x8fa0faa5f69f073d:0x656b2da8f85723be!8m2!3d10.0232346!4d-84.1121791!16s%2Fg%2F1pp2tywc7?entry=ttu',
 '© 2026 Café UNA. Todos los derechos reservados.');

INSERT IGNORE INTO enlaces_sitio (Id, Etiqueta, Ruta, Seccion, Orden, AbrirEnNuevaPestana) VALUES
(1, 'Sobre nosotros', '/AboutUs', 'Navbar', 1, 0),
(2, 'Productos', '/productos', 'Navbar', 2, 0),
(3, 'Voluntariado', '/voluntariado/solicitar', 'Navbar', 3, 0),
(4, 'Nuestra Historia', '/AboutUs', 'FooterExplorar', 1, 0),
(5, 'Tienda Online', '/productos', 'FooterExplorar', 2, 0),
(6, 'Voluntariado', '/voluntariado/solicitar', 'FooterExplorar', 3, 0),
(7, 'Mi Cuenta', '/login', 'FooterExplorar', 4, 0);

INSERT IGNORE INTO galeria_institucional (Id, Title, Image, Orden) VALUES
(1, 'Feria', 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=80', 1),
(2, 'Visita de campus Liberia', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80', 2),
(3, 'Venta de café', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=900&q=80', 3),
(4, 'Día del agricultor', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=80', 4);

-- INSERT IGNORE no corrige filas que ya existen con tildes rotas.

UPDATE textos_institucionales
   SET Title = 'Historia',
       Description = 'Café UNA, más de una década de tradición, calidad y sostenibilidad. ¡Disfruta el auténtico sabor de Costa Rica!\nEste café es producido por la Escuela de Ciencias Agrarias de la Universidad Nacional (ECA-UNA). Tiene un empaque diseñado por Arturo Rodríguez Segura, egresado de la Escuela de Arte y Comunicación Visual. Este diseño representa a Heredia como ciudad universitaria, con sus verdes montañas y cafetales, donde se produce el aromático café por manos de estudiantes, docentes y personas trabajadoras del campo, con un alto contenido de responsabilidad ambiental y social.'
 WHERE Clave = 'historia';

UPDATE textos_institucionales
   SET Title = 'Misión',
       Description = 'Lograr que la gente se enamore del café'
 WHERE Clave = 'mission';

UPDATE textos_institucionales
   SET Title = 'Visión',
       Description = 'Tenemos la visión de que en unos años esto triunfará'
 WHERE Clave = 'vision';

UPDATE tarjetas_inicio
   SET Titulo = 'Cada aporte transforma una vida',
       Descripcion = 'Tu contribución financia iniciativas sostenibles, investigaciones y programas de bienestar que impactan a toda la comunidad universitaria.'
 WHERE Clave = 'donaciones';

UPDATE tarjetas_inicio
   SET Titulo = 'Conocé el corazón del proyecto',
       Descripcion = 'Agendá una visita guiada a nuestras instalaciones y viví de cerca la experiencia del Café UNA, sus cultivos y su gente.'
 WHERE Clave = 'visitas';

UPDATE tarjetas_inicio
   SET Titulo = 'Sumá tu energía a nuestra misión',
       Descripcion = 'Formá parte del equipo de voluntarios que sostiene las actividades del Café UNA. Tu tiempo y dedicación dejan huella.'
 WHERE Clave = 'voluntariado';

UPDATE productos SET Nombre = 'Café de prueba', Descripcion = 'Descripción de prueba' WHERE Id = 1;
UPDATE productos SET Nombre = 'Café especial', Descripcion = 'Café de tueste medio para el día a día.' WHERE Id = 2;
UPDATE productos SET Nombre = 'Café Tarrazú', Descripcion = 'Granos seleccionados de la zona de Los Santos, con notas de chocolate y caramelo. Tostado medio para resaltar su dulzura natural.' WHERE Id = 3;
UPDATE productos SET Nombre = 'Café de altura', Descripcion = 'Mezcla de especialidad ideal para métodos de filtrado. Perfil aromático con notas cítricas y un cuerpo suave en taza.' WHERE Id = 4;
UPDATE productos SET Nombre = 'Cafecito tostado', Descripcion = 'Rico café tostado.' WHERE Id = 5;

-- Productos (solo si no existen: INSERT IGNORE igual dispara el trigger de destacados)

INSERT INTO productos (Id, Nombre, Descripcion, Imagen, PrecioNormal, PrecioConIVA, Stock, Estado, Peso, EsDestacado)
SELECT 1, 'Café de prueba', 'Descripción de prueba',
 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=80',
 5000.00, 5650.00, 0, 'Habilitado', '500g', 0
 WHERE NOT EXISTS (SELECT 1 FROM productos WHERE Id = 1);

INSERT INTO productos (Id, Nombre, Descripcion, Imagen, PrecioNormal, PrecioConIVA, Stock, Estado, Peso, EsDestacado)
SELECT 2, 'Café especial', 'Café de tueste medio para el día a día.',
 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80',
 3000.00, 3390.00, 9, 'Habilitado', '1 kg', 1
 WHERE NOT EXISTS (SELECT 1 FROM productos WHERE Id = 2);

INSERT INTO productos (Id, Nombre, Descripcion, Imagen, PrecioNormal, PrecioConIVA, Stock, Estado, Peso, EsDestacado)
SELECT 3, 'Café Tarrazú',
 'Granos seleccionados de la zona de Los Santos, con notas de chocolate y caramelo. Tostado medio para resaltar su dulzura natural.',
 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=900&q=80',
 5200.00, 5876.00, 19, 'Habilitado', '250g', 1
 WHERE NOT EXISTS (SELECT 1 FROM productos WHERE Id = 3);

INSERT INTO productos (Id, Nombre, Descripcion, Imagen, PrecioNormal, PrecioConIVA, Stock, Estado, Peso, EsDestacado)
SELECT 4, 'Café de altura',
 'Mezcla de especialidad ideal para métodos de filtrado. Perfil aromático con notas cítricas y un cuerpo suave en taza.',
 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=80',
 4800.00, 5424.00, 19, 'Habilitado', '250g', 1
 WHERE NOT EXISTS (SELECT 1 FROM productos WHERE Id = 4);

INSERT INTO productos (Id, Nombre, Descripcion, Imagen, PrecioNormal, PrecioConIVA, Stock, Estado, Peso, EsDestacado)
SELECT 5, 'Cafecito tostado', 'Rico café tostado.', '',
 1000.00, 1130.00, 99, 'Habilitado', '1kg', 0
 WHERE NOT EXISTS (SELECT 1 FROM productos WHERE Id = 5);
