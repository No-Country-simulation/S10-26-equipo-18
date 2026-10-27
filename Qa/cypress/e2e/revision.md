 ### Revision 25/10/2026 estado actual

 ### 1. Stack Elegido por el Equipo vs. proyecto-repusense.pdf

  El stack que decidió el equipo cumple al 100% con el documento:

  • Data / Scraping: Python + Playwright + BeautifulSoup / Regex
  • Backend: FastAPI (Python)
  • Frontend: Next.js + React + TailwindCSS + Redux Toolkit
  • Base de Datos: PostgreSQL 17 (en Docker)
  • IA (LLM): Google Gemini (google-genai)
  ──────
  ### 2. Comparativa de los "3 Problemas que el Equipo Tiene que
  Resolver" (Págs. 1 y 2 del PDF)

   Desafío del PDF │ Qué pide proyecto… │ Estado actual en … │ Brecha /…
  ─────────────────┼────────────────────┼────────────────────┼───────────
   1. Manejo de    │ Extraer de Google  │ En                 │ Integrar
   bloqueos y      │ Maps/Yelp sin ser  │ feature/scraper-re │ el
   recolección     │ bloqueados         │ al-maps: Usa       │
   eficiente       │ ser bloqueados  │ Playwright      │
                   │ (tiempos de     │ headless, User- │
                   │ espera,         │ Agent, locale   │
                   │ headless        │ es-AR y         │ ice.py con
                   │ browser, anti-  │ micro_pausa     │ rotación de
                   │ bot).           │ aleatoria (0.3s │ User-Agent y
                   │                 │ 1.5s).En        │ manejo de error
                   │                 │ Front/Guia/repu │ 429/Captcha
                   │                     │ 1.5s).En      │ 429/Captcha
                   │                     │ Front/Guia/re │ (TC-E1-NF-
                   │                     │ pusense_scrap │ 01).
                   │                                │ micro_p │ de User-
                   │                                │ ausa    │ Agent y
                   │                                │ aleator │ manejo
                   │                                │ ia      │ de error
                   │                                │ (0.3s - │ 429/Capt
                   │                                │ 1.5s).E │ cha (TC-
                   │                                │ n       │ E1-NF-
                   │                                │ Front/G │ 01).
                   │                                │ uia/rep │
                   │                                │ usense_ │
                   │                                │ scraper │
                   │                                │ .py:    │
                   │                                │ Tiene   │
                   │                                │ rotació │
                   │                                │ n de 4  │
                   │                                │ USER_AG │
                   │                                │ ENTS y  │
                   │                                 │              │ ra
                   │                                 │              │ pe
                   │                                 │              │ r_
                   │                                 │              │ se
                   │                                 │              │ rv
                   │                                 │              │ ic
                   │                                 │              │ e.
                   │                                 │              │ py
                   │                                 │              │ co
                   │                                 │              │ n
                   │                                 │              │ ro
                   │                                 │              │ ta
                   │                                 │              │ ci
                   │                                 │              │ ón
                   │                                 │              │ de
                   │                                 │              │ Us
                   │                                 │              │ er
                   │                                 │              │ -A
                   │                                 │              │ ge
                   │                                 │              │ nt
                   │                                 │              │ y
                   │                                 │              │ ma
                   │                                 │              │ ne
                   │                                 │              │ jo
                   │                                 │              │ de
                   │                                 │              │ er
                   │                                 │              │ ro
                   │                                 │              │ r
                   │                                 │              │ 42
                   │                                 │              │ 9/
                   │                                 │              │ Ca
                   │                                 │              │ pt
                   │                                 │              │ ch
                   │                         │                       │ e
                   │                         │                       │ r
                   │                         │                       │ _
                   │                         │                       │ s
                   │                         │                       │ e
                   │                         │                       │ r
                   │                         │                       │ v
                   │                         │                       │ i
                   │                         │                       │ c
                   │                         │                       │ e
                   │                         │                       │ .
                   │                         │                       │ p
                   │                         │                       │ y
                   │                         │                       │ c
                   │                         │                       │ o
                   │                         │                       │ n
                   │                         │                       │ r
                   │                         │                       │ o
                   │                         │                       │ t
                   │                         │                       │ a
                   │                         │                       │ c
                   │                         │                       │ i
                   │                         │                       │ ó
                   │                         │                       │ n
                   │                         │                       │ d
                   │                         │                       │ e
                   │                         │                       │ U
                   │                         │                       │ s
                   │                         │                       │ e
                   │                         │                       │ r
                   │                         │                       │
                   │                         │                       │
                   │                         │                       │
                   │                         │                       │
                   │                         │                       │
                   │                         │                       │ -A
                   │                         │                       │  m
                   │                         │                       │ a
                   │                         │                       │ n
                   │                         │                       │ e
                   │                         │                       │ j
                   │                         │                       │ o
                   │                         │                       │ d
                   │                         │                       │ e
                   │                         │                       │ e
                   │                         │                       │ r
                   │                         │                       │ r
                   │                         │                       │ o
                   │                         │                       │ r
                   │                         │                       │ 4
                   │                         │                       │ 2
                   │                         │                       │ 9
                   │                         │                       │ /
                   │                         │                       │ C
                   │                         │                       │ a
                   │                         │                       │ p
                   │                         │                       │ t
                   │                         │                       │ c
                   │                         │                       │ h
                   │                         │                       │ a
                   │                         │                       │ (
                   │                         │                       │ T
                   │                         │                       │ C
                   │                         │                       │
                   │                         │                       │
                   │                         │                       │
                   │                        │                        │
                   │                        │                        │
                   │                        │                        │
                   │                        │                        │
                   │                        │                        │
                   │                        │                        │ -E
   2. El problema  │ Los directorios solo   │ En DB (leads):         │ F
   del dato de     │ dan teléfono o web.    │ Columnas telefono,     │ a
   contacto        │ ¿Cómo cruzar           │ web, email, linkedin   │ l
   (Enriquecimient │ automáticamente la web │ listas.En Front:       │ t
   o)              │ del negocio para       │ Muestra los 4 canales  │ a
                   │ hallar email o         │ y filtra por canal.En  │ i
                   │ LinkedIn válido?       │ Scraper real           │ m
                   │                        │ (src/scraper.py):      │ p
                   │                        │ Extrae telefono y web  │ l
                   │                        │ de Google Maps, pero   │ e
                   │                        │ deja "email": None,    │ m
                   │                        │ "linkedin": None       │ e
                   │                        │ fijos.                 │ n
                   │                        │                        │ t
                   │                        │                        │ a
                   │                        │                        │ r
                   │                        │                        │ e
                   │                        │                        │ n
                   │                        │                        │ e
                   │                        │                        │ l
                   │                        │                        │ S
                   │                        │                        │ c
                   │                        │                        │ r
                   │                        │                        │ a
                   │                        │                        │ p
                   │                        │                        │ e
                   │                        │                        │ r
                   │                        │                        │ /
                   │                        │                        │ B
                   │                        │                        │ a
                   │                        │                        │ c
                   │                        │                        │ k
                   │                        │                        │ e
                   │                        │                        │ l
                   │                        │                        │ p
                   │                        │                        │ a
                   │                        │                        │ s
                   │                        │                        │ o
                   │                        │                        │ d
                   │                        │                        │ e
                   │                        │                        │ e
                   │                        │                        │ n
                   │                        │                        │ t
                   │                        │                        │ r
                   │                        │                        │ a
                   │                        │                        │ r
                   │                        │                        │ a
                   │                        │                        │ l
                   │                        │                        │ a
                   │                        │                        │ U
                   │                        │                        │ R
                   │                        │                        │ L
                   │                        │                        │ w
                   │                        │                        │ e
                   │                        │                        │ b
                   │                        │                        │ d
                   │                        │                        │ e
                   │                        │                        │ l
                   │                        │                        │ n
                   │                        │                        │ e
                   │                        │                        │ g
                   │                        │                        │ o
                   │                        │                        │ c
                   │                        │                        │ i
                   │                        │                        │ o
                   │                        │                        │ (
                   │                        │                        │ c
                   │                        │                        │ o
                   │                        │                        │ n
                   │                        │                        │ h
                   │                        │                        │ t
                   │                        │                        │ t
                   │                        │                        │ p
                   │                        │                        │ x
                   │                        │                        │ /
                   │                        │                        │ B
                   │                        │                        │ e
                   │                        │                        │ a
                   │                        │                        │ u
                   │                        │                        │ t
                   │                        │                        │ i
                   │                        │                        │ f
                   │                        │                        │ u
                   │                        │                        │ l
                   │                        │                        │ S
                   │                        │                        │ o
                   │                        │                        │ u
                   │                        │                        │ p
                   │                        │                        │ +
                   │                        │                        │ R
                   │                        │                        │ e
                   │                        │                        │ g
                   │                        │                        │ e
                   │                        │                        │ x
                   │                        │                        │ )
                   │                        │                        │ p
                   │                        │                        │ a
                   │                        │                        │ r
                   │                        │                        │ a
                   │                        │                        │ e
                   │                        │                        │ x
                   │                        │                        │ t
                   │                        │                        │ r
                   │                        │                        │ a
                   │                        │                        │ e
                   │                        │                        │ r
                   │                        │                        │ e
                   │                        │                        │ m
                   │                        │                        │ a
                   │                        │                        │ i
                   │                        │                        │ l
                   │                        │                        │ y
                   │                        │                        │ l
                   │                        │                        │ i
                   │                        │                        │ n
                   │                        │                        │ k
                   │                        │                        │ e
                   │                        │                        │ d
                   │                        │                        │ i
                   │                        │                        │ n
                   │                        │                        │ r
                   │                        │                        │ e
                   │                        │                        │ a
                   │                        │                        │ l
                   │                        │                        │ e
                   │                        │                        │ s
                   │                        │                        │ (
                   │                        │                        │ U
                   │                        │                        │ S
                   │                        │                        │
                   │                        │                        │
                   │                        │                        │ -0
                   │                        │                        │  U
                   │                        │                        │ S
                   │                        │                        │
                   │                        │                        │
                   │                        │                        │
                   │                        │                        │
                   │                        │                        │ -0

────────────────────────────────────────────────────────────
  ──────
  ###  Resumen de Revisión Integral (QA) — Alineación entre Base de
  Datos, Back/Scraper y Front según proyecto-repusense.pdf

  Revision de los avances de Base de Datos, 25/10/26
  Backend/Scraper y Frontend contrastados contra los requerimientos del
  proyecto (proyecto-repusense.pdf) y la Matriz de Casos de Prueba de QA,
  para anticipar posibles choques antes de integrar todo en dev.

  Lo qué está listo y qué detalles necesitamos alinear entre
  las áreas para que no falle la conexión:

  #### 1. Base de Datos (PostgreSQL / dbdiagram)

  El diseño relacional (usuarios, leads, resenas, escaneos,
  escaneo_leads), el UPSERT anti-duplicados (que actualiza rating y
  num_resenas sin pisar el estado comercial), los estados de análisis IA
  (pendiente/completado/fallido), los catálogos (problema_ia, estado) y
  el umbral resenas_min = 11 están excelentes y alineados a los
  requisitos.

  • Ajustes sugeridos en DB para no chocar con Scraper y Front:
      1. Tabla resenas: Agregar la columna autor VARCHAR(150), ya que
      tanto el Scraper real como el Drawer del Frontend muestran el
      nombre del autor de cada reseña.
      2. Campo huella_texto en resenas: Definir con Back si el hash SHA-
      256 lo envía FastAPI al insertar o si se genera por defecto en
      PostgreSQL, ya que hoy es NOT NULL y el scraper no lo calcula.
      3. Tabla usuarios y seed.sql: En Front el modelo Vendedor usa cargo,
      iniciales y color, y el login usa valeria.rios@repusense.io.
      Conviene contemplarlos en usuarios / seed.sql.


  #### ⚙ 2. Backend (FastAPI) y Scraper

  • Puntos clave para que encaje con la Base de Datos y el Front:
      1. Claves de deduplicación obligatorias: La tabla leads en DB tiene
      un CHECK que exige que fuente_id o clave_dedupe no sean nulos. El
      Scraper/Back debe extraer el ID del lugar (fuente_id) o armar
      clave_dedupe (ej. nombre|ciudad) al guardar en la DB (hoy el
      scraper solo genera un id random).
      2. Unificar respuesta de Gemini (ia_service.py): Tanto la DB (CHECK
      en problema_ia) como el Front esperan que el problema sea uno de
      los 6 códigos cerrados: 'atencion', 'precios', 'higiene', 'demoras',
      'calidad', 'citas', que incluya confianzaIA (0-100) y que el
      borrador venga separado en asunto y cuerpo (como está en
      feature/scraper-real-maps). En feat/santi/backend-estructura hoy
      devuelve texto libre de 10 palabras y el correo en un solo string,
      lo que daría error de constraint al guardar en DB y al renderizar
      los badges en Front.
      3. Reglas de negocio en el Scraper (proyecto-repusense.pdf):
          • Ajustar filtro de calificación a 1.5 <= rating <= 3.5 (en
          src/scraper.py hoy dice 0 < rating <= rating_max, dejando pasar
          menores a 1.5).
          • Ajustar reseñas mínimas a > 10 (>= 11) (hoy el default es >=
          10).
          • Ajustar max_resenas de 4 a 5 reseñas negativas recientes,
          como pide el PDF.
      4. Enriquecimiento de contacto (email y linkedin): Falta sumar el
      paso de entrar a la web del negocio encontrada en Maps para extraer
      email (descartando falsos positivos como .png o info@domain.com) y
      enlace de linkedin (en src/scraper.py hoy quedan en None).
      5. Serialización hacia el Front: Al armar los endpoints de FastAPI
      (GET /leads, POST /scan), recordar mapear las columnas snake_case
      de PostgreSQL al formato camelCase que consume el Front (numResenas,
      problema, confianzaIA, draft: { asunto, cuerpo }, reviewsNegativas:
      [], actualizado).


  #### 3. Frontend

  El Dashboard, KPIs, gráficos, filtros de tabla, exportación CSV UTF-8 y
  Drawer con copiado de borrador están muy completos.

  • Pendientes detectados por QA para alinear:
      1. Ajustar en /nueva-busqueda el slider de calificación para que
      permita el rango 1.5 a 3.5 (#24 / TC-SEARCH-01) y que el umbral de
      reseñas sea > 10 (mínimo 11) (TC-REG-01).
      2. Corregir el área clicable del botón "Lanzar escaneo radar" en el
      Dashboard (#34, hoy solo responde del lado izquierdo).
      3. Reemplazar el llamado local /api/scan y los mocks por los
      endpoints de FastAPI cuando Back y DB estén integrados.


  #### 4. Entregable para el Demo Day (200+ Leads Reales)

  • El PDF pide una base de datos poblada con al menos 200 leads reales
  extraídos durante las pruebas (y en QA validamos que carguen en < 2
  seg). Apenas quede conectado el Scraper con PostgreSQL, podemos correr
  las búsquedas para poblar esos 200+ registros reales y dejarlos listos
  en un script de carga para la Demo.
  ──────