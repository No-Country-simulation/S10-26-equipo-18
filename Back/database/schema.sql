-- RepuSense MVP - PostgreSQL 15+ | esquema idempotente para entorno local
-- Permite búsquedas sin distinguir acentos
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE TABLE IF NOT EXISTS usuarios (
  id VARCHAR(100) PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  cargo VARCHAR(100),
  password_hash VARCHAR(255),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id VARCHAR(100) PRIMARY KEY,
  fuente_id VARCHAR(255),
  clave_dedupe VARCHAR(300),
  nombre VARCHAR(255) NOT NULL,
  rubro VARCHAR(100) NOT NULL,
  ciudad VARCHAR(100) NOT NULL,
  fuente VARCHAR(100) NOT NULL,
  rating NUMERIC(3,2) NOT NULL CHECK (rating BETWEEN 0 AND 5),
  num_resenas INTEGER NOT NULL DEFAULT 0 CHECK (num_resenas >= 0),
  telefono VARCHAR(50),
  web TEXT,
  email VARCHAR(255),
  linkedin TEXT,
  problema_ia VARCHAR(30) CHECK (problema_ia IN ('atencion','precios','higiene','demoras','calidad','citas')),
  confianza_ia INTEGER CHECK (confianza_ia BETWEEN 0 AND 100),
  origen_analisis VARCHAR(20) CHECK (origen_analisis IN ('gemini','fallback','manual')),
  estado_analisis VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado_analisis IN ('pendiente','completado','fallido')),
  draft_asunto TEXT,
  draft_cuerpo TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'nuevo' CHECK (estado IN ('nuevo','contactado','convertido','perdido')),
  vendedor_id VARCHAR(100) REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  ultimo_escaneo TIMESTAMPTZ,
  CHECK (fuente_id IS NOT NULL OR clave_dedupe IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_leads_fuente_id ON leads (fuente, fuente_id) WHERE fuente_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_leads_clave_dedupe ON leads (fuente, clave_dedupe) WHERE clave_dedupe IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_leads_ciudad_rubro ON leads (ciudad, rubro);
CREATE INDEX IF NOT EXISTS ix_leads_estado ON leads (estado);
CREATE INDEX IF NOT EXISTS ix_leads_vendedor ON leads (vendedor_id);

CREATE TABLE IF NOT EXISTS resenas (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lead_id VARCHAR(100) NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  autor VARCHAR(150),
  fecha DATE,
  texto TEXT NOT NULL CHECK (length(btrim(texto)) > 0),
  estrellas INTEGER NOT NULL CHECK (estrellas BETWEEN 1 AND 5),
  huella_texto VARCHAR(64) NOT NULL CHECK (huella_texto ~ '^[0-9a-f]{64}$'),
  UNIQUE (lead_id, huella_texto)
);
CREATE INDEX IF NOT EXISTS ix_resenas_lead ON resenas (lead_id);

CREATE TABLE IF NOT EXISTS escaneos (
  id VARCHAR(100) PRIMARY KEY,
  usuario_id VARCHAR(100) REFERENCES usuarios(id) ON DELETE SET NULL,
  ciudad VARCHAR(100) NOT NULL,
  rubro VARCHAR(100) NOT NULL,
  plataformas TEXT[] NOT NULL CHECK (cardinality(plataformas) > 0),
  rating_min NUMERIC(3,2) NOT NULL DEFAULT 1.50 CHECK (rating_min BETWEEN 0 AND 5),
  rating_max NUMERIC(3,2) NOT NULL DEFAULT 3.50 CHECK (rating_max BETWEEN 0 AND 5),
  resenas_min INTEGER NOT NULL DEFAULT 11 CHECK (resenas_min >= 0),
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  nuevos INTEGER NOT NULL DEFAULT 0 CHECK (nuevos >= 0),
  actualizados INTEGER NOT NULL DEFAULT 0 CHECK (actualizados >= 0),
  total INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0),
  estado VARCHAR(20) NOT NULL DEFAULT 'en_progreso' CHECK (estado IN ('en_progreso','completado','fallido')),
  duracion_seg INTEGER CHECK (duracion_seg IS NULL OR duracion_seg >= 0),
  CHECK (rating_min <= rating_max),
  CHECK (nuevos + actualizados <= total)
);
CREATE INDEX IF NOT EXISTS ix_escaneos_fecha ON escaneos (fecha DESC);

CREATE TABLE IF NOT EXISTS escaneo_leads (
  escaneo_id VARCHAR(100) NOT NULL REFERENCES escaneos(id) ON DELETE CASCADE,
  lead_id VARCHAR(100) NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  rating_observado NUMERIC(3,2) CHECK (rating_observado BETWEEN 0 AND 5),
  num_resenas_observadas INTEGER CHECK (num_resenas_observadas >= 0),
  detectado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (escaneo_id, lead_id)
);
CREATE INDEX IF NOT EXISTS ix_escaneo_leads_lead ON escaneo_leads (lead_id);
