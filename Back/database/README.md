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
- `migrations/001_agregar_campos_usuarios_resenas.sql`: actualización de tablas existentes sin eliminar datos.

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

El sistema identifica negocios mediante la combinación de `fuente` y un identificador estable de la plataforma (`fuente_id`), cuando está disponible.

Si el scraper no obtiene un identificador estable, FastAPI deberá generar una `clave_dedupe` normalizada a partir de datos del negocio, como nombre, ciudad y dirección cuando esté disponible.

La tabla `leads` exige que al menos uno de estos identificadores tenga valor. Los índices UNIQUE parciales evitan duplicados dentro de una misma fuente.

El UPSERT permite actualizar la calificación y la cantidad de reseñas de un negocio existente sin crear un nuevo registro ni sobrescribir su estado comercial o vendedor asignado.

La tabla `escaneo_leads` conserva las observaciones realizadas en distintos escaneos.

**Responsabilidades de integración:**

- **Scraper:** extraer los datos del negocio y proporcionar un identificador estable cuando sea posible.
- **FastAPI:** validar los datos, construir `clave_dedupe` cuando sea necesario y ejecutar el UPSERT.
- **PostgreSQL:** aplicar las restricciones de unicidad y conservar el historial de escaneos.

La generación de `fuente_id` y `clave_dedupe` está pendiente de integración con el scraper real y FastAPI.

## Reseñas y usuarios

### Almacenamiento de reseñas

La tabla `resenas` almacena las reseñas asociadas a cada lead.

- `autor`: nombre del autor obtenido por el scraper. Es opcional y puede ser `NULL`.
- `fecha`: fecha asociada a la reseña. Durante la integración deberá definirse si corresponde a la publicación original o a la extracción.
- `texto`: contenido de la reseña.
- `estrellas`: calificación de 1 a 5.
- `huella_texto`: hash SHA-256 de 64 caracteres hexadecimales utilizado para evitar reseñas duplicadas.

**Generación de `huella_texto`:**

Se propone que FastAPI calcule el hash antes de insertar cada reseña, utilizando una representación normalizada de `lead_id`, fecha, estrellas y texto.

El archivo `seed.sql` ya calcula las huellas mediante SHA-256 en PostgreSQL para los datos de prueba. La implementación en Python deberá utilizar exactamente el mismo criterio de normalización para obtener resultados consistentes.

La restricción `UNIQUE (lead_id, huella_texto)` impide insertar dos veces una reseña con la misma huella para un mismo negocio.

La generación de huellas desde FastAPI está pendiente de implementación.

### Usuarios

La tabla `usuarios` incorpora dos campos opcionales:

- `cargo`: puesto o función del usuario dentro de la organización.
- `password_hash`: campo reservado para almacenar un hash seguro de contraseña cuando se implemente la autenticación real.

Ambos campos admiten `NULL`.

Actualmente, los usuarios y las credenciales utilizados en el frontend son datos de demostración y no están conectados con la autenticación de FastAPI.

Las contraseñas nunca deben almacenarse en texto plano. Cuando se implemente el login real, deberán utilizarse algoritmos específicos para contraseñas, como Argon2id.

Los campos visuales `iniciales` y `color` no forman parte del esquema de PostgreSQL, ya que pueden resolverse desde el frontend.

## Diagrama entidad-relación

El archivo `repusense.dbml` puede abrirse en https://dbdiagram.io/ para visualizar las tablas y relaciones.

## Estado de implementación

**Validado localmente:**
- Creación de las cinco tablas.
- Carga inicial de datos sintéticos.
- Restricciones y claves foráneas.
- UPSERT y deduplicación de negocios.
- Conservación del estado comercial y del historial de escaneos.
- Incorporación de las columnas opcionales `autor`, `cargo` y `password_hash` en PostgreSQL local.

**Pendiente:**
- Integración del scraper real con PostgreSQL mediante FastAPI.
- Implementación de la generación de `huella_texto` y `clave_dedupe` en backend.
- Obtención de un identificador estable del negocio desde el scraper.
- Conexión de modelos SQLAlchemy y endpoints FastAPI.
- Pruebas integrales entre scraper, backend, base de datos y frontend.
- Implementación futura de autenticación real.