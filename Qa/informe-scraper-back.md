# Evaluación del Scraper Real de Google Maps vs. Requerimientos del Proyecto

**Ramas / Archivos evaluados:** `feature/scraper-real-maps/src/scraper.py` frente a `ANALISIS_FUNCIONAL_Y_MATRIZ_PRUEBAS.md`
**Condición:** Evaluación

---

## 1. General

> **La afirmación del equipo de Backend es correcta:**
> El scraper en la rama `feature/scraper-real-maps` es 100% real, no es una simulación. Utiliza **Playwright** con Chromium para navegar la interfaz real de Google Maps, aplica técnicas antibot, interactúa con el DOM para ordenar y extraer opiniones auténticas de usuarios, y se conecta con **Google Gemini** para análisis semántico.
>
> **Sin embargo, frente a los requerimientos funcionales del proyecto, el cumplimiento es PARCIAL (~55% de los requerimientos de backend):**
> Resuelve de forma sobresaliente la extracción de Maps y el análisis de quejas con IA, pero deja fuera la extracción de correos/LinkedIn, la persistencia en base de datos y la cota inferior del filtro de estrellas.

---

## 2. Lo que el Scraper Real SÍ Cumple (Puntos Fuertes)

| Requerimiento Funcional | ¿Cumple? | Evidencia en el Código del Scraper Real |
| :--- | :---: | :--- |
| **Scraping Real de Google Maps** | **SÍ** | Abre Chromium sin flags de automatización (`--disable-blink-features=AutomationControlled`), descarta imágenes para optimizar ancho de banda, maneja el banner de cookies de Google y navega el feed dinámico de resultados. |
| **Filtro de volumen de reseñas (US-02)** | **SÍ** | Parsea con regex el número de opiniones en la tarjeta (`match_res = re.search(r"(\d[\d.,]*)", card_text)`) y descarta locales con menos de 10 reseñas antes de hacer clic en la ficha. |
| **Filtro de techo de estrellas (US-02)** | **SÍ** | Descarta comercios con calificación superior a 3.5★ (`rating <= rating_max`). |
| **Extracción de Quejas Críticas (US-04)** | **SÍ** | Entra a la pestaña de "Opiniones/Reseñas", hace clic en "Ordenar", selecciona "Más bajas", expande el botón "Más" de los textos largos y filtra estrictamente reseñas con calificación de 1 a 3 estrellas (`estrellas <= 3`). |
| **Clasificación y Confianza IA (US-04)** | **SÍ** | Envía los textos reales de las quejas a Gemini, quien clasifica en las 6 categorías del proyecto (atención, precios, higiene, demoras, calidad, citas) y asigna el porcentaje de confianza. |
| **Borrador de Cold Email (US-05)** | **SÍ** | Gemini genera el asunto y el cuerpo personalizado citando el dolor detectado. |
| **Tolerancia a fallos de IA (AC-04.2)** | **SÍ** | Cuenta con reintentos con backoff y una función `_fallback_local()` con draft de contingencia si la API de Gemini tiene demoras o error 503. |
| **Extracción de Teléfono y Web** | **SÍ** | Extrae el enlace oficial (`authority`) y el teléfono (`phone:`), limpiando caracteres extraños. |

---

## 3. Lo que el Scraper Real NO Cumple o Tiene Inconsistencias

A pesar de su calidad técnica en la navegación, existen 4 brechas funcionales directas contra el documento de Análisis Funcional de QA:

### ❌ 1. Incumplimiento en Filtro Inferior de Estrellas (Caso QA TC-EXT-03)
* **Requisito AC-02.1:** Los negocios deben estar en el rango de 1.5 a 3.5 estrellas. Negocios con menos de 1.5★ deben descartarse (suelen ser negocios cerrados o abandonados).
* **Código actual en `scraper.py` (Línea 214):**
  ```python
  if not (0 < rating <= rating_max and num_resenas >= resenas_min):
      continue
  ```
* **Problema:** Acepta negocios con calificación 1.0, 1.2 o 1.4 estrellas, lo cual hace fallar el caso de prueba TC-EXT-03.

---

### ❌ 2. Ausencia Total de Extracción de Emails y LinkedIn (Épica 3: US-06 y US-07)
* **Requisito AC-06.1 y AC-07.1:** El pipeline debe visitar la web del negocio o su sección de contacto para extraer emails válidos y enlaces de LinkedIn.
* **Código actual en `scraper.py` (Línea 261):**
  ```python
  "email": None,       # Hardcodeado en None
  "linkedin": None,    # Hardcodeado en None
  ```
* **Problema:** Aunque captura la URL web del local en Google Maps, nunca navega a dicha web. Esto deja al Frontend sin correos para la prospección comercial.

---

### ❌ 3. Ausencia de Persistencia y Anti-duplicados (Upsert - US-03)
* **Requisito AC-03.1:** Si se corre la misma búsqueda, debe actualizar métricas en base de datos sin duplicar registros.
* **Código actual:** La deduplicación solo vive en memoria en un `set()` (`nombres_vistos`) mientras el script está corriendo. Al finalizar la ejecución, el script imprime un JSON en terminal y los datos se pierden. No hay base de datos persistente.

---

### ❌ 4. Parámetros Fijos y Falta de Interfaz de Conexión
* **Requisito AC-01.1:** El usuario o el Frontend debe poder enviar la ciudad y el rubro dinámicamente.
* **Código actual:** En `scraper.py`, los parámetros están fijos en el bloque principal (`if __name__ == "__main__":`). No posee `argparse` ni expone una API REST (FastAPI) para que el Frontend lo invoque.

---

## 4. Viabilidad para la Meta del Demo Day (200 Leads Reales)

El scraper realiza un scraping muy profundo por cada local (abre la ficha, va a opiniones, cambia el orden a "más bajas", expande los botones "Más", lee textos y consulta a Gemini).

* **Tiempo por negocio:** Aproximadamente 10 a 20 segundos por local.
* **Implicancia para 200 leads:**
  * 200 leads requerirían entre **35 y 60 minutos** de ejecución continua de Playwright.
  * Google Maps suele desplegar bloqueos por IP (Captcha o limitación de tasa) tras 20 a 30 consultas seguidas desde una misma IP.
* **Conclusión para el Demo Day:** El scraper real funciona perfecto para pruebas de 2 a 5 comercios, pero para llegar al Demo Day con los 200 leads requeridos por requerimiento del proyecto, el backend necesitará ejecutarlo por lotes en segundo plano y guardar los resultados en una base de datos para no depender de raspar 200 negocios en vivo durante la presentación.