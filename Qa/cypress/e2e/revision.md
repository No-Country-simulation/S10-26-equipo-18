# Revisión del proyecto RepuSense — Estado al 25/10/2026

## 1. Stack elegido por el equipo vs. `proyecto-repusense.pdf`

El stack definido por el equipo está alineado con el documento del proyecto:

- **Data / Scraping:** Python + Playwright + BeautifulSoup / Regex.
- **Backend:** FastAPI (Python).
- **Frontend:** Next.js + React + TailwindCSS + Redux Toolkit.
- **Base de datos:** PostgreSQL 17 en Docker.
- **IA (LLM):** Google Gemini (`google-genai`).

---

## 2. Comparativa de los desafíos del proyecto

### 2.1. Manejo de bloqueos y recolección eficiente

**Qué solicita el proyecto**

Extraer información de Google Maps/Yelp reduciendo el riesgo de bloqueos mediante tiempos de espera, navegador headless y medidas anti-bot.

**Estado identificado**

- En `feature/scraper-real-maps` se utiliza Playwright headless, `User-Agent`, locale `es-AR` y una pausa aleatoria (`micro_pausa`) de entre 0,3 y 1,5 segundos.
- En `Front/Guia/repusense_scraper.py` se identifica una rotación de cuatro `USER_AGENTS`.

**Brecha / pendiente**

Integrar y validar en el scraper el manejo de errores HTTP 429 y CAPTCHA, con cobertura del caso de prueba `TC-E1-NF-01`. La rotación de `User-Agent` y el manejo de errores también aparecen señalados como pendientes de integración en `scraper_service.py`.

### 2.2. Enriquecimiento de datos de contacto

**Qué solicita el proyecto**

Los directorios pueden proporcionar únicamente el teléfono o la web del negocio. Se necesita visitar la web del negocio para intentar encontrar un email o un perfil válido de LinkedIn.

**Estado identificado**

- La base de datos (`leads`) contempla las columnas `telefono`, `web`, `email` y `linkedin`.
- El Frontend muestra los cuatro canales y permite filtrar por canal.
- El scraper real (`src/scraper.py`) extrae teléfono y web de Google Maps, pero deja `email` y `linkedin` con valores `None`.

**Brecha / pendiente**

Implementar el paso de enriquecimiento que visite la URL del negocio para extraer emails y enlaces de LinkedIn, validando los resultados y descartando falsos positivos.

---

## 3. Resumen de revisión integral de QA

### Alineación entre Base de Datos, Backend/Scraper y Frontend

**Fecha de revisión:** 25/10/2026.

Se contrastaron los avances de Base de Datos, Backend/Scraper y Frontend con los requisitos de `proyecto-repusense.pdf` y la matriz de casos de prueba de QA, para anticipar incompatibilidades antes de integrar las áreas en `dev`.

El objetivo es identificar qué está listo y qué detalles deben alinearse para evitar fallos de integración.

### 3.1. Base de Datos (PostgreSQL / dbdiagram)

El diseño relacional incluye las tablas `usuarios`, `leads`, `resenas`, `escaneos` y `escaneo_leads`. También contempla:

- UPSERT para evitar duplicados, actualizando `rating` y `num_resenas` sin sobrescribir el estado comercial.
- Estados de análisis de IA: `pendiente`, `completado` y `fallido`.
- Catálogos `problema_ia` y `estado`.
- Umbral `resenas_min = 11`.

Estos elementos están alineados con los requisitos identificados.

**Ajustes sugeridos para evitar incompatibilidades con Scraper y Frontend:**

1. **Tabla `resenas`:** agregar la columna `autor VARCHAR(150)`, ya que tanto el scraper real como el Drawer del Frontend muestran el nombre del autor de cada reseña.
2. **Campo `huella_texto` en `resenas`:** acordar con Backend si FastAPI enviará el hash SHA-256 al insertar o si se generará por defecto en PostgreSQL. Actualmente el campo es `NOT NULL` y el scraper no calcula ese valor.
3. **Tabla `usuarios` y `seed.sql`:** el modelo `Vendedor` del Frontend utiliza `cargo`, `iniciales` y `color`. El login usa `valeria.rios@repusense.io`; conviene contemplar estos datos en la tabla y en el archivo de semillas.

### 3.2. Backend (FastAPI) y Scraper

**Puntos clave para alinear con la Base de Datos y el Frontend:**

1. **Claves de deduplicación obligatorias**

   La tabla `leads` tiene una restricción `CHECK` que exige que `fuente_id` o `clave_dedupe` no sean nulos. El Scraper/Backend debe extraer el ID del lugar (`fuente_id`) o generar una `clave_dedupe` —por ejemplo, `nombre|ciudad`— al guardar el registro. Actualmente, el scraper solo genera un ID aleatorio.

2. **Unificar la respuesta de Gemini (`ia_service.py`)**

   La Base de Datos (restricción `CHECK` en `problema_ia`) y el Frontend esperan que el problema pertenezca a uno de estos seis códigos:

   - `atencion`
   - `precios`
   - `higiene`
   - `demoras`
   - `calidad`
   - `citas`

   La respuesta también debe incluir `confianzaIA` (de 0 a 100) y separar el borrador de correo en `asunto` y `cuerpo`, como en `feature/scraper-real-maps`.

   En `feat/santi/backend-estructura`, la respuesta identificada devuelve texto libre de 10 palabras y el correo en un único string. Esto podría provocar errores al guardar en la Base de Datos y al representar las etiquetas (*badges*) en el Frontend.

3. **Reglas de negocio del scraper**

   Según `proyecto-repusense.pdf`, se deben aplicar estas reglas:

   - **Calificación:** `1.5 <= rating <= 3.5`. En `src/scraper.py` se identificó la condición `0 < rating <= rating_max`, que permite valores inferiores a 1.5.
   - **Cantidad mínima de reseñas:** más de 10, es decir, un mínimo de 11. El valor por defecto identificado permite actualmente `>= 10`.
   - **Reseñas negativas recientes:** ajustar `max_resenas` de 4 a 5, según el PDF.

4. **Enriquecimiento de contacto (`email` y `linkedin`)**

   Falta incorporar la visita a la web del negocio encontrada en Maps para extraer el email —descartando falsos positivos como archivos `.png` o direcciones genéricas como `info@domain.com`— y el enlace de LinkedIn. En `src/scraper.py`, ambos campos quedan actualmente en `None`.

5. **Serialización de datos hacia el Frontend**

   Al implementar los endpoints de FastAPI (`GET /leads` y `POST /scan`), mapear las columnas `snake_case` de PostgreSQL al formato `camelCase` que consume el Frontend. Entre los campos esperados se encuentran:

   - `numResenas`
   - `problema`
   - `confianzaIA`
   - `draft: { asunto, cuerpo }`
   - `reviewsNegativas: []`
   - `actualizado`

### 3.3. Frontend

El Dashboard, los KPIs, los gráficos, los filtros de tabla, la exportación CSV en UTF-8 y el Drawer con la función de copiar el borrador están desarrollados.

**Pendientes detectados por QA:**

1. **Filtros de `/nueva-busqueda`:** ajustar el slider de calificación para permitir el rango de 1.5 a 3.5 (`#24` / `TC-SEARCH-01`) y configurar el umbral de reseñas en más de 10, es decir, un mínimo de 11 (`TC-REG-01`) Resuelto 27/10.
2. **Botón “Lanzar escaneo radar”:** corregir el área clicable en el Dashboard, ya que actualmente solo responde en el lado izquierdo (`#34`) Resuelto 27/10.
3. **Integración con Backend:** reemplazar la llamada local `/api/scan` y los datos simulados (*mocks*) por los endpoints de FastAPI cuando Backend y Base de Datos estén integrados.

### 3.4. Entregable para el Demo Day: más de 200 leads reales

El PDF solicita una base de datos poblada con al menos **200 leads reales** extraídos durante las pruebas. En QA se valida que los registros carguen en menos de **2 segundos**.

Una vez conectado el Scraper con PostgreSQL, se podrán ejecutar búsquedas para poblar los más de 200 registros reales y dejarlos preparados en un script de carga para la demostración.
