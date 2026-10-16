# Plan de Tareas — Radar de Reputación en Crisis (RepuSense)

**Objetivo:** Presentar un MVP funcional en **4 semanas** en el Demo Day de NoCountry.
**Equipo:** 4–6 personas, sin roles fijos (cada uno aporta lo que sabe y ayuda en las demás tareas).
**Experiencia previa:** Ninguna en proyectos similares → el plan contempla aprendizaje y reduce riesgo técnico desde la Semana 1.

---

## 1. Definición de MVP presentable

El MVP es presentable cuando, en una demo de ~10 minutos, se puede demostrar **todo** lo siguiente (extraído del §10 del README):

| # | Criterio demoable | Bloque que lo cubre |
|---|---|---|
| 1 | Iniciar sesión (mock de 3 vendedores) | Frontend |
| 2 | Lanzar una búsqueda indicando **rubro y ubicación** desde la UI | Frontend + API |
| 3 | La extracción devuelve negocios desde una plataforma de origen | Scraper |
| 4 | Se aplican filtros de calificación (≤3.5★) y mínimo de reseñas (≥10) | Scraper + Backend |
| 5 | Los leads muestran datos recopilados **y** datos de contacto (tel/web/email) | Enriquecimiento |
| 6 | La IA etiqueta el problema principal de las reseñas | Pipeline IA |
| 7 | El dashboard permite **filtrar** y **exportar a CSV** | Frontend |
| 8 | Se genera un **borrador de correo personalizado** (asunto + párrafo) con botón copiar | IA |
| 9 | La base de datos contiene **≥200 leads reales** | Recolectado masivo |
| 10 | KPIs + gráficos + historial de escaneos en el home (diferenciador visual) | Frontend |

### Lo que NO es MVP (posibles recortes si el tiempo aprieta)

- **LinkedIn automático:** es técnicamente muy difícil y con riesgo legal/bloqueo → si no hay tiempo, se omite o queda como campo manual. *Decidir en Semana 3.*
- **Múltiples plataformas:** el README pide "una plataforma de origen" → **con Google Maps (o la fuente elegida) basta**. TripAdvisor/Yelp son opcionales.
- **Autenticación real:** basta login mock con 1 clic.
- **Modal de Configuración completo:** puede quedar en versión mínima (cambio de vendedor + umbrales).
- **Modo multi-tenant / permisos / notificaciones.**

### Priorización (si hay que recortar)

- **Crítico (sin esto no hay demo):** búsqueda → extracción → filtros → BD con upsert → tabla de leads → clasificación IA de problema → export CSV → borrador de correo → 200 leads.
- **Importante:** KPIs, gráficos, drawer de detalle completo, estados del lead, historial de escaneos.
- **Deseable:** animaciones de radar, modal de configuración, LinkedIn, segunda plataforma, responsive completo.

---

## 2. Riesgos clave (resolver en la Semana 1)

| Riesgo | Impacto | Mitigación |
|---|---|---|
| **Scraping de Google Maps** viola ToS y sufre bloqueos | Alto: puede tumbar el proyecto | Hacer un PoC el día 1–2. Alternativas en orden: Google Places API (oficial, tier gratuito) → SerpAPI → Playwright con throttling. **Decidir la fuente antes de terminar la Semana 1.** |
| Sin **API key de IA** | Alto: no hay feature diferenciadora | Usar Google Gemini (tier gratuito) u OpenAI. Conseguir la key el día 1. Validar con el PoC de IA. |
| **200 leads reales** requiere tiempo de máquina | Medio: es un entregable duro | Empezar a recolectar datos en paralelo desde Semana 2; dejar Semana 4 solo para auditoría, no para recolectar de cero. |
| **Sin roles definidos** → tareas caen en nadie | Medio: paradas y solapamientos | Daily de 15 min + tablero (GitHub Projects). Cada área crítica con **2 personas** que la conozcan (evitar silos). |
| Nadie ha hecho un proyecto así | Medio: estimaciones optimistas | Semana 1 dedicada a PoCs pequeños y aprendizaje; Semana 2 al pipeline end-to-end. Nada de features nuevas en Semana 4. |
| **LinkedIn** bloquea todo scraping | Bajo (si se recorta) | Recortar del MVP; verificar en Semana 3. |

---

## 3. Plan por semanas

### Semana 1 — Cimientos, decisiones técnicas y validación (PoCs)

**Objetivo de la semana:** tener el esqueleto del proyecto funcionando, el stack decidido y las **dos mayores incógnitas técnicas resueltas** (fuente de datos + API de IA), con los primeros leads reales.

**Meta dura al cierre de la semana:**
- ✅ Repo con entorno reproducible: cualquiera del equipo levanta backend + frontend en ≤10 min con un comando.
- ✅ Stack decidido y documentado en el README técnico.
- ✅ PoC de extracción: ≥10 negocios reales con nombre, rating, cantidad de reseñas, teléfono y web, aplicando los filtros.
- ✅ PoC de IA: 5 reseñas negativas → problema clasificado + asunto/párrafo de correo en JSON estructurado.
- ✅ Esquema de base de datos definido (leads + escaneos, índice único para anti-duplicados).
- ✅ Frontend compila y muestra el layout base (login mock + sidebar + página vacía de leads).

**Tareas:**

*Coordinación (todos)*
- [ ] Reunión de arranque: presentar el README y el spec UX (`message.md`), acordar stack, comunicación (canal diario) y **daily de 15 min**.
- [ ] Crear tablero de tareas (GitHub Projects) con las columnas: Backlog / Esta semana / En curso / Hecho / Bloqueado.
- [ ] Acordar convención de git: `main` estable, `develop`, ramas `feature/*`, PR mínimo con revisión de 1 persona.

*Decisiones técnicas (obligatorias antes del día 3)*
- [ ] Elegir stack completo, de forma que sirva a lo que el equipo ya sabe. Sugerencia coherente con el spec UX: **Next.js/React + Tailwind + recharts** (frontend), **FastAPI (Python)** o **Express (Node)** (backend), **PostgreSQL** (BD), lenguaje único scraper+backend si es posible para reducir fricción.
- [ ] **PoC de fuente de datos** (prioridad #1): probar Google Places API vs SerpAPI vs Playwright y elegir una. Documentar pros/contras y límites de rate.
- [ ] Conseguir API key de IA (Gemini 1.5 Flash, como indica el spec, u OpenAI) y validar coste/limite gratuito.

*Infraestructura y datos*
- [ ] Setup del monorepo (carpetas `backend/`, `frontend/`, `docs/`), `.env.example`, guía de "cómo levantar el proyecto" en README.
- [ ] Diseñar esquema BD a partir de la tabla del §7 del README: campos de lead, `place_id + fuente` como clave única, `updated_at`, estados del lead (`Nuevo`, `Contactado`, `Convertido`, `Perdido`), tabla de escaneos (búsqueda) con contador nuevos vs actualizados.
- [ ] Definir el contrato de la API (endpoints y payloads) en un doc antes de codificar en paralelo.

*PoCs (2 personas en backend/scraper, 2 en frontend/IA, rotando)*
- [ ] Script PoC de extracción: entrada "rubro + ciudad" → salida JSON con ≥10 negocios reales respetando filtros (≤3.5★, ≥10 reseñas).
- [ ] Función PoC de IA: prompt con template que devuelva `{ problema, confianza, asunto, parrafo }` en JSON válido.
- [ ] Esqueleto frontend: app con login mock (3 vendedores del spec), layout con sidebar y rutas vacías (`/`, `/nueva-busqueda`, `/leads`).
- [ ] Definir los tokens de diseño del spec (colores semánticos, tipografías Space Grotesk/Inter, favicon).

**Checkpoint de fin de Semana 1 (preguntas de control):**
1. ¿Alguien del equipo pudo levantar el proyecto siguiendo solo la guía? → Si no, arreglar la guía.
2. ¿Tenemos una fuente de datos elegida y probada? → Si no, es el **único blocker** para la Semana 2; no avanzar con el pipeline hasta resolverlo.
3. ¿La IA devuelve JSON válido con el problema clasificado? → Ajustar prompts si no.

---

### Semana 2 — Pipeline end-to-end + datos persistidos (primer demo interno)

**Objetivo de la semana:** que exista el flujo completo **buscar → extraer → filtrar → clasificar con IA → guardar en BD**, visible desde el frontend. Es el "MVP funcional" a nivel interno.

**Meta dura al cierre de la semana:**
- ✅ Desde la UI: llenar el formulario de "Nueva búsqueda" → aparecen leads reales en la tabla.
- ✅ Anti-duplicados funcionando: repetir la misma búsqueda no duplica; se actualizan y se cuentan "nuevos vs actualizados".
- ✅ Todo lead nuevo pasa por la IA y guarda su `problema_detectado`.
- ✅ Email de contacto extraído de la web del negocio cuando existe (regex).
- ✅ **50–80 leads reales** acumulados en la BD.
- ✅ Login mock funcional (cambio entre los 3 vendedores).

**Tareas:**

*Backend / Pipeline*
- [ ] Endpoint `POST /scans` (ciudad, rubro, filtros) que dispara el pipeline de extracción en background (con estado de progreso para la terminal en vivo del spec).
- [ ] Pipeline de extracción "producción": throttling, esperas aleatorias, reintentos, manejo de errores, logging paso a paso (los mismos logs que mostrará la consola del frontend).
- [ ] Upsert por `place_id + fuente` + `updated_at`; contador de leads nuevos vs actualizados por escaneo.
- [ ] Integrar la IA en el pipeline: clasificar problema de las últimas 5 reseñas negativas y persistirlo.
- [ ] Enriquecimiento de contacto: teléfono/web desde la fuente + **extracción de email** desde la web del negocio (home, `/contacto`, `mailto:`, regex).
- [ ] Endpoints de lectura: `GET /leads` con filtros y paginación, `GET /leads/:id`, `PATCH /leads/:id` (cambiar estado).

*Frontend*
- [ ] Pantalla **Nueva Búsqueda**: selects de ciudad/rubro, filtros (slider rating, mínimo reseñas), botón lanzar que llama a la API.
- [ ] Pantalla **Tabla de Leads**: paginación, columnas base (nombre, ciudad, rating, problema, contacto, estado, fecha), filtros básicos.
- [ ] Login mock con las 3 sesiones del spec y sesión persistente.
- [ ] Estados de carga y vacíos mínimos (evitar pantallas rotas durante la demo).

*Datos (tarea continua a partir de aquí)*
- [ ] Programar escaneos en paralelo (varias ciudades/rubros) para acumular leads. Objetivo Semana 2: 50–80.

*Calidad*
- [ ] Pruebas mínimas: una prueba del upsert, una del endpoint de leads con filtros, una del parser de IA.
- [ ] Primera demo interna de 5 minutos al equipo: buscar → ver leads.

**Checkpoint de fin de Semana 2 (preguntas de control):**
1. ¿El flujo completo funciona de punta a punta sin tocar la base de datos a mano? → Si no, esa es la prioridad del lunes siguiente.
2. ¿La búsqueda duplicada actualiza en vez de duplicar? → Revisar clave única.
3. ¿Vamos ≥50 leads? → Si no, aumentar frecuencia de escaneos.

---

### Semana 3 — Dashboard completo, IA de correos y masa de datos (MVP presentable)

**Objetivo de la semana:** tener **todas las pantallas del spec funcionales** y la feature diferenciadora (borrador de correo con IA) terminada. Al cierre, el MVP debe poder recorrerse entero sin roturas.

**Meta dura al cierre de la semana:**
- ✅ Home con 4 KPIs, gráfico de barras (6 dolores IA), donut de severidad, historial de escaneos (nuevos vs actualizados).
- ✅ Tabla de leads con filtros combinables, contador dinámico y **export CSV** (UTF-8 BOM).
- ✅ Drawer de detalle: contacto con botones copiar, reseñas con % de confianza, **draft de correo generado por IA** con "Copiar draft", cambio de estado en vivo.
- ✅ **150+ leads** en BD (en camino seguro a 200).
- ✅ Demo interna completa end-to-end sin errores críticos; lista de bugs priorizada.

**Tareas:**

*Feature diferenciadora (IA)*
- [ ] Generación de borrador de correo por lead: asunto + primer párrafo con gancho basado en las quejas reales (guardar o generar bajo demanda; decidir por coste de API).
- [ ] Indicador de confianza de la clasificación en el drawer.
- [ ] Botón "Copiar draft" + botones de copiar teléfono/web/email/LinkedIn.

*Frontend (seguir el spec pantalla por pantalla)*
- [ ] **Home (`/`)**: 4 KPIs, barras de distribución de problemas (recharts), donut de severidad, tabla de escaneos históricos.
- [ ] **Nueva Búsqueda**: monitor de radar animado (SVG `radar-sweep`) + terminal de logs en vivo del pipeline (puede ser polling simple).
- [ ] **Tabla de Leads**: barra sticky con filtros combinables (ciudad, rubro, dolor IA, estado, "con email"), contador dinámico, badges semánticos de severidad y de problema, export CSV.
- [ ] **Drawer de detalle**: todas las secciones del spec sin recargar la página.
- [ ] **Modal de configuración** (versión mínima): pestaña Equipo (cambiar vendedor), Reglas (umbrales, anti-duplicados), Motor IA (modelo/key) + botón reset BD de demo (puede quedar para Semana 4).

*Datos*
- [ ] Coordinar ventanas de escaneo masivo (varias ciudades/rubros en paralelo, sin saturar la fuente). Objetivo: 150+ leads con contacto y problema IA poblados.
- [ ] Decidir sobre **LinkedIn**: ¿es viable en el tiempo restante? Si no → recortar del MVP y comunicarlo.

*Calidad y retroalimentación*
- [ ] Pruebas con usuarios externos al equipo (otro grupo NoCountry si es posible): observar 1 sesión y anotar fricciones.
- [ ] Triar bugs: críticos (bloquean demo) / importantes / cosméticos.

**Checkpoint de fin de Semana 3 (preguntas de control):**
1. ¿Se puede recorrer el 100% del checklist de MVP (§1 de este doc) sin explicaciones excusándose? → Marcar lo que falte como **única prioridad** de la Semana 4.
2. ¿Estamos a ≥150 leads? → Si no, priorizar recolección por encima de pulido.
3. ¿Qué se recorta? → Comunicar al equipo ya (LinkedIn, segunda plataforma, config avanzada).

---

### Semana 4 — Pulido, 200 leads, pruebas y preparación del Demo Day

**Objetivo de la semana:** MVP **estable, con 200+ leads reales y demo ensayada**. **Congelar alcance:** solo bugs críticos y pulido; cero features nuevas.

**Meta dura al cierre de la semana:**
- ✅ **200+ leads reales** y auditados (sin duplicados raros, campos clave poblados).
- ✅ Checklist de MVP completo, verificado item por item.
- ✅ Entorno de demo estable + plan B (video grabado y/o datos precargados).
- ✅ Demo ensayada 2–3 veces con timing de 8–12 minutos.
- ✅ Repo documentado (README, arquitectura, cómo correr).

**Tareas:**

*Congela y estabiliza (días 1–2)*
- [ ] Reunión: congelar alcance. Lista blanca de cambios permitidos: bugs de demo, texto, estética menor.
- [ ] Corregir bugs críticos de la lista priorizada de la Semana 3.
- [ ] Auditoría de datos: leads duplicados, sin problema IA, sin rating, reviews vacías → re-scaneo puntual de los faltantes.

*Garantizar los 200 leads (paralelo, día 1–3)*
- [ ] Ejecutar escaneos restantes hasta superar 200 leads con: nombre, ciudad, rubro, rating, reseñas, problema IA, al menos teléfono o web.
- [ ] Verificar límites/rate de la fuente para no bloquearse justo antes de la demo.

*Pulido UX (día 2–4)*
- [ ] Estados vacíos, loading y mensajes de error amigables en todas las pantallas.
- [ ] Animaciones clave del spec (radar sweep, pulso del home), badges y colores semánticos correctos.
- [ ] Rendimiento: la tabla con 200+ filas debe ir fluida (paginación/filtros en el cliente o server-side).
- [ ] Responsive mínimo para la pantalla en que se hará la demo.

*Pruebas y demo (día 3–5)*
- [ ] Ejecutar el checklist de la §1 **manualmente, item por item**, con el entorno limpio.
- [ ] Prueba de humo: recorrer la demo con datos nuevos generados en vivo (una búsqueda real) — si la fuente falla en vivo, tener la búsqueda ya hecha como fallback.
- [ ] **Deploy** (Vercel + Railway/Render, o entorno local con hotspot de respaldo) + **grabar video de la demo completa** como plan B por si cae internet.
- [ ] Ensayar la demo 2–3 veces con el equipo: guion de 8–12 min (problema → 30 seg; búsqueda en vivo → 2 min; leads + filtros → 2 min; drawer + IA + correo → 3 min; KPIs y cierre → 2 min).
- [ ] Materiales finales: README técnico, diagrama de arquitectura simple, presentación breve, video corto.

*Equipo*
- [ ] Retrospectiva final: qué funcionó, qué mejorarían, lecciones para la próxima simulación.

**Checkpoint de fin de Semana 4 (día del Demo):**
1. ¿Checklist §1 completo en verde? → Si algo falla, activar plan B (video + datos precargados).
2. ¿Hay 200+ leads? → Entregable duro; verificar el día antes.
3. ¿Alguien ajeno al equipo hizo la demo sin ayuda? → Si sí, están listos.

---

## 4. Resumen visual de hitos

| Semana | Tema | Estado esperado al cierre |
|---|---|---|
| **1** | Cimientos y PoCs | Repo reproducible + stack decidido + fuente de datos probada + PoC extracción (10 leads) + PoC IA + esquema BD + layout frontend |
| **2** | Pipeline end-to-end | Búsqueda desde la UI → leads reales en tabla + upsert + IA en pipeline + 50–80 leads |
| **3** | Dashboard completo | Todas las pantallas del spec + CSV + drawer + borrador IA + 150+ leads + demo interna sin roturas |
| **4** | Pulido y Demo | 200+ leads auditados + checklist completo + deploy/video + demo ensayada + docs |

---

## 5. Cómo organizarse sin roles fijos

- **Daily de 15 min** (stand-up): ¿qué hice, qué hago, qué bloquea. Obligatorio desde la Semana 1.
- **Cada área crítica con 2 personas** que la conozcan (scraper, IA, frontend). Evita que si alguien se cae, el área muera.
- **Rotación voluntaria:** quien termina su tarea toma la siguiente del tablero; si está bloqueado, ayuda a quien esté atascado (regla del equipo).
- **Definition of Done** mínima: código en `develop`, probado a mano, sin errores en consola, visible en el tablero.
- **Revisión de PR cruzada:** nunca se aprueba el propio PR.
- **Reunión de sincronización** Semana 1 → Semana 2 → Semana 3 → Semana 4: repasar el checkpoint de la semana y reasignar personas según el cuello de botella.

---

## 6. Recomendación de split de trabajo por bloque (orientativo, no un rol fijo)

| Bloque | Personas sugeridas | Semanas activas |
|---|---|---|
| Scraper / pipeline de extracción | 2 | 1–4 (luego mantenimiento) |
| Backend API + BD + upsert | 1–2 | 1–3 |
| Integración IA (clasificación + redacción) | 1–2 | 1–3 |
| Frontend (búsqueda, tabla, drawer) | 2–3 | 1–4 |
| Dashboard home (KPIs + gráficos) | 1 | 3–4 |
| Datos masivos (200 leads) + QA demo | rotativo | 2–4 |
| Coordinación, docs y preparación demo | 1 rotativo por semana | 1–4 |

> Con 4–6 personas: 2 en scraper/backend, 2 en frontend, 1 en IA, 1 en datos/QA que rota. Si son 4: 2 scraper+backend, 1 frontend, 1 IA+datos, rotando en Semana 4.

---

*Documento generado a partir de `README.md` (requerimientos) y `message.md` (espec UX/UI) del repositorio.*
