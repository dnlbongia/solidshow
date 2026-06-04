-- =============================================================
-- SolidShow - Esquema de Base de Datos para MariaDB
-- Ejecutar en HeidiSQL (Ctrl+Shift+Q o pegar y ejecutar)
-- =============================================================

CREATE DATABASE IF NOT EXISTS solidshow
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE solidshow;

-- ===================== USUARIOS (admin) =====================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================== CONFIGURACIÓN =====================
CREATE TABLE IF NOT EXISTS settings (
  `key` VARCHAR(100) PRIMARY KEY,
  `value` TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================== EVENTOS =====================
CREATE TABLE IF NOT EXISTS eventos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  `date` DATE NOT NULL,
  `time` VARCHAR(20),
  location VARCHAR(255),
  image VARCHAR(255),
  ticket_price DECIMAL(10,2) DEFAULT 0,
  ticket_url VARCHAR(500),
  published TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================== RESERVAS =====================
CREATE TABLE IF NOT EXISTS reservas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL,
  telefono VARCHAR(50) NOT NULL,
  tipo_evento VARCHAR(100) NOT NULL,
  fecha_evento DATE NOT NULL,
  invitados INT NOT NULL,
  mensaje TEXT,
  status VARCHAR(20) DEFAULT 'pendiente',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================== TESTIMONIOS =====================
CREATE TABLE IF NOT EXISTS testimonios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  role VARCHAR(200),
  text TEXT NOT NULL,
  avatar VARCHAR(500),
  rating INT DEFAULT 5,
  published TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================== GALERÍA =====================
CREATE TABLE IF NOT EXISTS galeria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(10) NOT NULL CHECK (type IN ('image','video')),
  filename VARCHAR(255) NOT NULL,
  alt TEXT,
  section VARCHAR(50) DEFAULT 'general',
  ord INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================== ADMIN POR DEFECTO =====================
-- Contraseña: admin123 (hash bcrypt)
INSERT INTO users (username, password) VALUES (
  'admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
) ON DUPLICATE KEY UPDATE username = username;

-- ===================== CONFIGURACIÓN POR DEFECTO =====================
INSERT INTO settings (`key`, `value`) VALUES
  ('site_name', 'SolidShow'),
  ('site_description', 'Hacemos de tu evento una experiencia inolvidable'),
  ('contact_email', 'hola@solidshow.mx'),
  ('contact_phone', '+52 55 1234 5678'),
  ('contact_address', 'Av. Reforma 350, Col. Juárez, CDMX'),
  ('reservas_email', 'reservas@solidshow.mx'),
  ('hero_title', 'Hacemos de tu evento una experiencia inolvidable'),
  ('hero_subtitle', 'Organizamos eventos corporativos y sociales con creatividad, profesionalismo y pasión.'),
  ('social_facebook', '#'),
  ('social_instagram', '#'),
  ('social_twitter', '#'),
  ('social_linkedin', '#')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

-- ===================== TIPOS DE EVENTOS =====================
CREATE TABLE IF NOT EXISTS tipos_eventos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section VARCHAR(50) NOT NULL UNIQUE,
  icon VARCHAR(100) NOT NULL DEFAULT 'fa-folder',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image VARCHAR(255) DEFAULT '',
  ord INT DEFAULT 0,
  published TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO tipos_eventos (section, icon, title, description, ord) VALUES
  ('corporativos',  'fa-briefcase', 'Corporativos',        'Conferencias, lanzamientos, convenciones y team building con estándar profesional.', 1),
  ('sociales',      'fa-ring',      'Sociales',             'Bodas, cumpleaños, aniversarios y celebraciones familiares inolvidables.',            2),
  ('conciertos',    'fa-music',     'Fiestas & Conciertos', 'Producción completa de eventos musicales con sonido, iluminación y logística.',         3),
  ('talleres',      'fa-chalkboard','Talleres & Seminarios', 'Espacios formativos con materiales, facilitadores y certificación incluida.',           4)
ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), icon = VALUES(icon), ord = VALUES(ord);
