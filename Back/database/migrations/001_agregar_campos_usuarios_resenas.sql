-- Migracion 001: agregar campos opcionales
-- para usuarios y resenas existentes.

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS cargo VARCHAR(100),
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

ALTER TABLE resenas
  ADD COLUMN IF NOT EXISTS autor VARCHAR(150);