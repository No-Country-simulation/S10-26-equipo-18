# Arquitectura y modificaciones necesarias para la integración E2E

Frente a esta arquitectura (Vercel + FastAPI en Render + Browserless + PostgreSQL en Render) y para que exista **100% de consistencia con los 200 leads reales que ya armamos**, sin modificar nada aún, esto es exactamente lo que se tendría que modificar y/o agregar:

## 1. En `Back/app/services/scraper_service.py` (Scraper conectado a Browserless)

1. **Cambiar la conexión del navegador a Browserless (líneas 126–130):**
   - Leer `BROWSERLESS_URL` desde las variables de entorno y conectar con `p.chromium`.
   - Utilizar `connect_over_cdp(browserless_url)`, dejando `p.chromium.launch()` solo como respaldo si se corre en local sin Browserless.

2. **Corregir la lectura de `num_resenas` para que no descarte todo en 0 (líneas 183–191):**
   - En el listado lateral de Google Maps ya no viene `(123)` en `card_text`.
   - Hay que validar en el listado solo el rating (`1.5 <= rating <= 3.5`) y leer `num_resenas` una vez abierta la ficha del comercio (desde los `aria-label` de opiniones), verificando ahí `num_resenas >= resenas_min`.

3. **Subir de 4 a 5 las reseñas negativas extraídas (líneas 34 y 223):**
   - Cambiar `max_resenas=4` a `max_resenas=5` en `extraer_resenas_negativas()` para que coincida con las 5 reseñas negativas que tienen los 200 leads.

4. **Conectar `enrichment_service.py` y exigir contacto completo (líneas 214–245):**
   - Limpiar los parámetros `?utm_source=google...` de la web.
   - Tomar el teléfono desde el `aria-label` del botón `phone:`.
   - Llamar a `enrichment_service.py` para obtener email y LinkedIn (en vez de dejar `"email": None` y `"linkedin": None`).
   - Si el comercio no tiene web/email o teléfono, descartarlo (`continue`) para mantener la regla de que el 100% de los leads tengan email.

## 2. En `Back/app/services/enrichment_service.py` (Hoy vacío en 0 bytes)

Agregar la función `enriquecer_contacto_web(url_web, nombre, ciudad)`:

- Utiliza `httpx` y `BeautifulSoup` (que ya están en `requirements.txt` y no consumen navegador de Browserless) para visitar el sitio web del comercio y extraer su email (`mailto:` o regex) y su LinkedIn (`linkedin.com/company/...`).
- Asegura que los leads nuevos que entren por Browserless tengan el mismo formato de email y LinkedIn que los 200 leads migrados.

## 3. En `Back/app/services/lead_persistence_service.py` (Anti-duplicados con los 200 leads)

**Lo que ya es 100% compatible:**

Los 200 leads que generamos tienen su campo clave `clave_dedupe` con el mismo formato exacto (`normalizar(nombre)|normalizar(ciudad)`) que usa `lead_persistence_service.py` (líneas 17–28). Si alguien escanea con Browserless un comercio que ya está entre los 200, no se duplicará, sino que se actualizará.

**Lo único a agregar (líneas 126–130):**

Al actualizar un lead existente, hoy actualiza `rating`, `num_resenas`, `ultimo_escaneo`, `telefono` y `web`, pero falta agregar que también actualice `lead.email` y `lead.linkedin` si vienen con valor:

```python
if valores["email"]:
    lead.email = valores["email"]

if valores["linkedin"]:
    lead.linkedin = valores["linkedin"]
```

## 4. En `Back/app/services/scan_worker.py` (Ejecución controlada en segundo plano)

Agregar un semáforo de concurrencia (`asyncio.Semaphore(1)`):

- Como Browserless (en su plan estándar/gratuito) permite 1 sesión de navegador a la vez, conviene envolver `ejecutar_escaneo` en `scan_worker.py` con un `SCAN_LOCK = asyncio.Semaphore(1)`.
- Así, si se lanzan dos escaneos seguidos en `BackgroundTasks`, se ejecutan en fila uno tras otro de forma controlada, sin que Browserless rechace la conexión.

## 5. En Render y Vercel (Configuración sin tocar código de Front)

### 5.1. PostgreSQL en Render

Ejecutar `seed_200_leads.sql` para que ya estén cargados los 200 comercios reales y sus 1.000 reseñas.

### 5.2. FastAPI en Render (Environment Variables)

Configurar las siguientes variables de entorno:

- `DATABASE_URL` = URL de PostgreSQL en Render.
- `GEMINI_API_KEY` = API Key de Gemini.
- `BROWSERLESS_URL` = `wss://production-sfo.browserless.io?token=TU_TOKEN`.

### 5.3. Frontend en Vercel (Environment Variables)

- `NEXT_PUBLIC_API_URL` = `https://s10-26-equipo-18.onrender.com` (y hacer Redeploy).
- No hace falta modificar código en el Frontend porque la integración que subió Pablo en el PR #43 ya soporta el flujo asíncrono `202 Accepted` + polling cada 2.5 segundos que usa `BackgroundTasks`.