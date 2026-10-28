# Especificación de Diseño y Prototipos UI/UX — Radar de Reputación en Crisis

**Equipo:** S10-26-equipo-18
**Proyecto:** Radar de Reputación en Crisis (Simulación Laboral Abierta — NoCountry)
**Issue de referencia:** [#15 — [UX/UI] Prototipado y diseño de pantallas de referencia para el Dashboard](https://github.com/No-Country-simulation/S10-26-equipo-18/issues/15)
**Fecha:** Octubre 2026
**Autor / Responsable:** Maria Chiribao (*QA Tester*)

---

## 1. Propósito y Contexto

Ante la ausencia de un rol formal de **UX/UI Designer** en el equipo, esta propuesta visual fue elaborada desde el área de **QA** a partir del [Análisis Funcional y Criterios de Aceptación (US-01 a US-10)](../qa/ANALISIS_FUNCIONAL_Y_MATRIZ_PRUEBAS.md).

El objetivo es suministrar un marco de referencia visual claro y un flujo de interacción intuitivo para los desarrolladores de **Frontend**, facilitando la ejecución directa de:
* **Issue #8:** Inicializar proyecto base y configurar framework de estilos (Tailwind CSS).
* **Issue #9:** Maquetar la vista principal del Dashboard con tabla de leads y mock data.
* **Issue #10:** Implementar barra de filtros (rating, ciudad, rubro) conectada al estado.

---

## 2. Acceso al Prototipo Interactivo

Acceso a las referencias visuales

A) Diseños y pantallas de referencia en Figma

> 🔗 **Enlace al proyecto en Figma:**
> [https://figma.com/design/8PODoQQvR2ORoprAukt0JL/REPUSENSE?node-id=3-3]
(https://figma.com/design/8PODoQQvR2ORoprAukt0JL/REPUSENSE?node-id=3-3)

B) El diseño interactivo de alta fidelidad y las maquetas de pantallas se encuentran centralizados en Google Stitch:

> 🔗 **Enlace al proyecto en Google Stitch:**
> [https://stitch.withgoogle.com/projects/6276686851629626104](https://stitch.withgoogle.com/projects/6276686851629626104)

---

## 3. Arquitectura Visual y Vistas Diseñadas

El prototipo comprende el flujo principal de trabajo del operador comercial / usuario B2B:

### 3.1. Barra de Navegación y Cabecera (Header / Navbar)
* **Identidad:** Nombre de la aplicación (*Radar de Reputación en Crisis*) y logotipo.
* **Métricas globales:** Conteo rápido de leads totales detectados y meta del Demo Day (mínimo 200 leads calificados).
* **Acciones globales:** Botón para exportar todos los leads a CSV (UTF-8) y botón de refresco/sincronización.

### 3.2. Panel de Filtros Rápidos (Filter Bar)
Barra superior anclada sobre la tabla de datos que permite refinar en tiempo real:
* **Ciudad / Ubicación:** Selector desplegable (ej. Bogotá, Medellín, Buenos Aires, etc.).
* **Rubro / Categoría:** Selector desplegable (ej. Clínicas dentales, Restaurantes, Gimnasios, etc.).
* **Rango de Calificación:** Filtro específico para el segmento en crisis (**1.5 a 3.5 estrellas**).
* **Estado del Análisis de IA:** Badges de estado (*Analizado*, *Pendiente*, *Contactado*).
* **Búsqueda por texto libre:** Input para buscar por nombre del negocio o palabra clave.

### 3.3. Vista Principal — Tabla de Leads
Estructura en cuadrícula optimizada para lectura rápida y toma de decisiones comerciales:
* **Nombre del negocio y ubicación:** Nombre comercial destacado y dirección física.
* **Calificación y Reseñas:** Rating visual con estrellas y volumen de reseñas (garantizando > 10 reseñas).
* **Dolor Principal (IA Tag):** Badge categorizado con código de color según la queja recurrente (ej. `Mala atención`, `Precios excesivos`, `Demoras en servicio`, `Higiene deficiente`).
* **Canales de Contacto:** Indicadores con iconos de acceso directo para:
  * Correo electrónico extraído (con botón de copia rápida).
  * Teléfono.
  * Sitio web verificado.
  * Perfil de LinkedIn.
* **Acción principal por fila:** Botón *"Ver Propuesta / Detalle"* para abrir la ficha extendida.

### 3.4. Modal / Vista Detallada de Lead y Outreach B2B
Ficha emergente que consolida el análisis de inteligencia artificial y la propuesta comercial personalizada:
1. **Ficha del Negocio:** Datos completos de contacto y resumen de métricas.
2. **Diagnóstico de Reputación:** Muestra de hasta 5 reseñas negativas representativas analizadas por el modelo de IA y categorización del problema raíz.
3. **Generador de Borrador Comercial (Cold Email):**
   * **Asunto sugerido:** Asunto empático orientado a la oportunidad de mejora sin tono acusatorio.
   * **Cuerpo del mensaje:** Párrafos estructurados (introducción personalizada, mención de la queja sin confrontación y propuesta de solución de reputación).
   * **Botón *"Copiar borrador"*:** Acción en un clic con confirmación visual (*Toast notification* en pantalla).

---

## 4. Recomendaciones Técnicas para Frontend

* **Framework de estilos:** Se recomienda utilizar clases utilitarias de **Tailwind CSS**, priorizando una paleta con:
  * Tonos oscuros / neutros para la estructura del Dashboard (estilo analítico/SaaS profesional).
  * Colores de advertencia (ámbar/naranja/rojo suave) para resaltar las calificaciones en crisis (1.5 a 3.5 estrellas).
  * Color de acento primario (azul o violeta) para las llamadas a la acción (*Exportar*, *Copiar borrador*).
* **Feedback de usuario:** Asegurar microinteracciones visuales:
  * Estados *hover* y *focus* en botones y filas de la tabla.
  * Notificación *Toast* flotante al hacer clic en "Copiar borrador" o "Exportar CSV".
  * Estados de carga (*Skeletons* o spinners) mientras se filtran los leads o se procesa la IA.
* **Diseño Responsivo:** Enfoque prioritario en resolución de escritorio (Desktop 1280px+) y adaptación fluida para tablets, dada la naturaleza del trabajo de prospección comercial.

---

## 5. Trazabilidad con Historias de Usuario

| Vista / Componente | Historias de Usuario Asociadas |
| :--- | :--- |
| Barra de Filtros | `US-01` (Extracción por zona/rubro), `US-02` (Filtros rating), `US-08` (Filtrado dinámico) |
| Tabla de Leads | `US-02` (Volumen de reseñas), `US-03` (Deduplicación/Upsert), `US-09` (Exportación CSV) |
| Detalle de Lead / IA | `US-04` (Detección dolor principal), `US-06` (Datos de contacto), `US-07` (LinkedIn) |
| Borrador Comercial | `US-05` (Generación de correo frío), `US-10` (Copia al portapapeles con toast) |
