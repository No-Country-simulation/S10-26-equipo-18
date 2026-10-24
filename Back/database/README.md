# Base de datos — RepuSense

## Descripción

La base de datos de RepuSense utiliza PostgreSQL 17 y permite almacenar negocios potenciales (leads), sus reseñas, usuarios y el historial de escaneos realizados por el sistema.

El modelo está diseñado para evitar la duplicación de negocios y conservar la información comercial durante las actualizaciones.

## Estructura

| Tabla | Descripción |
|---|---|
| `usuarios` | Información de usuarios y vendedores |
| `leads` | Negocios detectados y sus datos comerciales |
| `resenas` | Reseñas asociadas a cada negocio |
| `escaneos` | Registro de las búsquedas realizadas |
| `escaneo_leads` | Relación entre escaneos y negocios detectados |

## Archivos

- `schema.sql`: creación de tablas, claves y restricciones.
- `seed.sql`: datos sintéticos para pruebas.
- `pruebas.sql`: pruebas de UPSERT, historial y validaciones.
- `repusense.dbml`: modelo entidad-relación para dbdiagram.io.

## Ejecución local

Desde la raíz del repositorio:

1. Configurar `POSTGRES_PASSWORD` en el archivo `.env` local.
2. Ejecutar `docker compose up -d postgres`.
3. Comprobar el estado con `docker compose ps postgres`.
4. Consultar las tablas con `docker compose exec postgres psql -U repusense -d repusense -c "\dt"`.

En la primera inicialización de un volumen vacío, Docker ejecuta automáticamente `schema.sql` y `seed.sql`.

## Pruebas

Desde PowerShell, en la raíz del repositorio:

```powershell
Get-Content -Raw Back/database/pruebas.sql |
  docker compose exec -T postgres psql -U repusense -d repusense -v ON_ERROR_STOP=1
```

Para consultar la cantidad de leads:

```powershell
docker compose exec postgres psql -U repusense -d repusense -c "SELECT COUNT(*) FROM leads;"
```

## Deduplicación

El sistema identifica negocios mediante su fuente y un identificador estable de la plataforma, cuando está disponible.

El UPSERT permite actualizar la calificación y la cantidad de reseñas de un negocio existente sin crear un nuevo registro ni sobrescribir su estado comercial.

La tabla `escaneo_leads` conserva las observaciones realizadas en distintos escaneos.

## Diagrama entidad-relación

El archivo `repusense.dbml` puede abrirse en https://dbdiagram.io/ para visualizar las tablas y relaciones.

## Estado de implementación

**Validado localmente:** creación de tablas, carga inicial, restricciones, UPSERT y conservación del historial de escaneos.

**Pendiente:** integración del scraper real y conexión definitiva con los modelos y endpoints FastAPI del equipo.