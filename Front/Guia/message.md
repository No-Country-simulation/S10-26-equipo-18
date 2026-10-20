# RepuSense — Fundamentos y Especificación UX/UI

**Producto:** Radar de Reputación en Crisis (B2B SaaS interno para agencia de PR / Marketing Digital).  
**Contexto:** Simulación Laboral Abierta — NoCountry.  
**Objetivo UX:** Que un equipo de ventas pase de prospectar manualmente 30 horas a la semana a lanzar un escaneo de radar y abordar decenas de leads calificados con correos personalizados en minutos.

---

## 1. Identidad Visual, Logotipo y Tipografía

### A. Isotipo y Logotipo
* **Concepto:** Radar militar / tecnológico de detección de crisis. Combina la sobriedad analítica de un dashboard de inteligencia comercial con la urgencia de mitigación de crisis reputacional.
* **Isotipo:** Cuadrante de radar en modo oscuro con tres anillos concéntricos de detección (`#14b8a6` con opacidades graduales `0.25`, `0.45`, `0.65`), retícula en cruz, haz de escaneo angular rotativo (`radar-sweep`) y baliza central activa (`#2dd4bf`). Incluye un punto objetivo en crisis en color carmesí (`#f43f5e`).
* **Favicon:** Vector SVG ubicado en [`public/favicon.svg`](public/favicon.svg), optimizado para pestañas de navegador en modo oscuro y claro con soporte retina.
* **Logomarca Textual:** 
  * Nombre: **RepuSense** (tipografía *Space Grotesk* en peso `700` Bold con tracking neutro).
  * Subtítulo / Tagline: **RADAR DE REPUTACIÓN** (*Inter* en peso `600`, tracking expandido `tracking-widest` en mayúsculas).

### B. Sistema Tipográfico
* **Display & Números:** `Space Grotesk` (Google Fonts).
  * Uso: Títulos principales (`text-2xl`, `text-3xl`), contadores numéricos de KPIs, calificaciones con estrellas, porcentajes de confianza y badges de rating.
  * Propiedad técnica: `.num { font-variant-numeric: tabular-nums; }` para evitar saltos visuales al cambiar valores.
* **UI & Tablas:** `Inter` (Google Fonts).
  * Uso: Navegación, etiquetas de formularios, celdas de la tabla de leads, textos de reseñas negativas y cuerpo del correo en frío.
  * Jerarquía de tamaños: `text-xs` (12px) y `text-sm` (14px) para garantizar una vista compacta de alta densidad.

### C. Paleta de Color Semántica (Modo Oscuro Radar)
* **Fondos y Superficies:**
  * Fondo general: `hsl(222 47% 5%)` (slate ultra oscuro).
  * Tarjetas y superficies: `hsl(222 44% 7%)` con bordes `hsl(217 30% 15%)`.
  * Barra lateral (Sidebar): `hsl(224 48% 6%)`.
* **Acento Primario (Radar Teal):** `hsl(172 66% 46%)` (`#14b8a6` / `#2dd4bf`).
* **Semáforo de Severidad de Calificación:**
  * Crisis Crítica (< 2.5★): Rojo Carmesí (`text-red-400`, `bg-red-500/10`, `border-red-500/30`).
  * Riesgo Medio (2.5★ – 3.4★): Ámbar (`text-amber-400`, `bg-amber-500/10`, `border-amber-500/30`).
  * En Vigilancia (≥ 3.5★): Verde Esmeralda (`text-emerald-400`, `bg-emerald-500/10`, `border-emerald-500/30`).
* **Categorías de Problemas IA (Badges de Dolor):**
  * `atencion`: Rose (`#f43f5e`)
  * `precios`: Orange (`#f97316`)
  * `higiene`: Yellow (`#eab308`)
  * `demoras`: Sky (`#0ea5e9`)
  * `calidad`: Violet (`#8b5cf6`)
  * `citas`: Teal (`#14b8a6`)

---

## 2. Personas y Gestión del Equipo de Ventas

El brief de NoCountry especifica un cuello de botella operacional para un **equipo de 3 vendedores**. El sistema modela y soporta a estos tres usuarios con sesiones activas intercambiables en 1 clic:

| Vendedor | Cargo / Especialidad | Correo Corporativo |
|---|---|---|
| **Valeria Ríos** (Sesión por defecto) | Consultora Senior de Reputación | `valeria.rios@repusense.io` |
| **Martín Sosa** | Especialista en Outbound B2B | `martin.sosa@repusense.io` |
| **Camila Torres** | Prospección Comercial & Cuentas | `camila.torres@repusense.io` |

---

## 3. Arquitectura de Pantallas y Flujos Funcionales

```
                ┌───────────────────────────────────┐
                │        PANTALLA DE LOGIN          │  (/login)
                │  - Acceso 3 vendedores (1 clic)   │
                │  - Credenciales corporativas      │
                └─────────────────┬─────────────────┘
                                  │ (Ingreso exitoso)
                                  ▼
                ┌───────────────────────────────────┐
                │          RADAR (HOME)             │  (/)
                │  - 4 KPIs en vivo                 │
                │  - Gráfico Barras (Problemas IA)  │
                │  - Donut (Severidad Rating)       │
                │  - Historial de Escaneos          │
                └────────┬─────────────────┬────────┘
                         │                 │
           (Lanzar nuevo)│                 │(Ver leads)
                         ▼                 ▼
   ┌───────────────────────────┐     ┌───────────────────────────┐
   │      NUEVA BÚSQUEDA       │     │      TABLA DE LEADS       │  (/leads)
   │  - Ciudad + Rubro         │     │  - Filtros en tiempo real │
   │  - Google Maps/TripAdvisor│     │  - Badges de Problemas IA │
   │  - Monitor con animación  │────▶│  - Exportar CSV           │
   │  - Terminal logs en vivo  │     │  - Drawer lateral         │
   │  - Anti-duplicados        │     └─────────────┬─────────────┘
   └───────────────────────────┘                   │ (Click fila)
                                                   ▼
                                     ┌───────────────────────────┐
                                     │     DRAWER DE DETALLE     │
                                     │  - Datos de contacto      │
                                     │  - Quejas reales (IA %)   │
                                     │  - Botón "Copiar Draft"   │
                                     │  - Cambiar estado lead    │
                                     └───────────────────────────┘
```

---

## 4. Detalle de Pantallas para Capturas y Presentación

### Pantalla 1: Inicio de Sesión (`/login`)
* **Elementos clave:**
  * Logotipo con haz de luz difuso y baliza animada con efecto `ping-soft`.
  * **Tarjetas de Acceso Rápido del Equipo:** Permite alternar entre Valeria Ríos, Martín Sosa y Camila Torres con un solo clic para fines de demo sin necesidad de recordar contraseñas.
  * Formulario de correo y contraseña para simulación corporativa.
  * Badge de verificación y atribución a NoCountry.

### Pantalla 2: Panel de Control Radar (`/`)
* **Elementos clave:**
  * Indicador superior de estado: *"Radar Operativo Activo"* con pulso verde esmeralda.
  * 4 Tarjetas de KPIs: Leads Totales (con conteo de nuevos), En Crisis Crítica (< 2.5★), Contacto Directo con Email, y Leads en Pipeline.
  * Gráfico de barras horizontales desarrollado en `recharts` que expone la distribución de los 6 dolores detectados por IA.
  * Gráfico donut con el nivel de urgencia de las reseñas.
  * Tabla de escaneos históricos con la columna diferenciadora de **Leads Nuevos vs Actualizados (Anti-duplicado)**.

### Pantalla 3: Nueva Búsqueda con Monitor Interactivo (`/nueva-busqueda`)
* **Elementos clave:**
  * Selectores de Ciudad objetivo (Bogotá, Medellín, CDMX, Lima, Buenos Aires, etc.) y Rubro comercial.
  * Selector múltiple de plataformas: Google Maps, TripAdvisor, Yelp.
  * Sliders/inputs de reglas de negocio: Calificación máxima (≤ 3.5★) y mínimo de reseñas (≥ 10).
  * **Monitor de radar con animación SVG de barrido rotativo (`radar-sweep`)**.
  * Terminal de consola en tiempo real que documenta los pasos del pipeline (conexión, scraping, clasificación de reseñas por IA, búsqueda web de emails, y chequeo anti-duplicados).

### Pantalla 4: Tabla Densa de Leads (`/leads`)
* **Elementos clave:**
  * Barra sticky superior con filtros combinables (Ciudad, Rubro, Dolor IA, Estado y botón rápido "Con email").
  * Contador dinámico en cabecera: X leads filtrados, Y nuevos, Z con email.
  * Botón de exportación instantánea a CSV (con formato UTF-8 BOM compatible con Microsoft Excel).
  * Columnas enriquecidas: Nombre + Fuente, Ciudad/Rubro, Rating con estrellas, Badge semántico del problema detectado por IA, Datos de contacto directo, Estado (`Nuevo`, `Contactado`, `Convertido`, `Perdido`) y fecha de escaneo.

### Pantalla 5: Drawer Lateral del Lead
* **Elementos clave:**
  * Mantiene el contexto visual de la tabla de fondo sin recargar la página.
  * Sección de contacto con botones individuales para copiar teléfono, web, email y perfil de LinkedIn.
  * Reseñas negativas textuales extraídas con indicador de confianza del modelo IA (ej. `88% confianza`).
  * **Caja de Draft de Correo en Frío:** Asunto y primer párrafo redactados por IA con gancho hiper-específico basado en las quejas reales del negocio. Botón *"Copiar draft"*.
  * Selector para cambiar el estado del lead que actualiza en tiempo real los KPIs del sistema y el contador lateral.

### Pantalla 6: Modal de Configuración y Reglas del Sistema
* **Accesible desde:** El botón *"Configuración y Reglas"* al pie de la barra lateral.
* **Pestañas:**
  1. **Equipo:** Muestra la sesión actual y permite cambiar entre los 3 vendedores o cerrar sesión.
  2. **Reglas Radar:** Ajusta los umbrales predeterminados de rating y opiniones, y activa/desactiva el control anti-duplicados.
  3. **Motor IA:** Especifica el modelo LLM (`gemini-1.5-flash`), la API Key de inferencia semántica y el botón de mantenimiento para **Restablecer la base de datos de demostración** a sus 214 registros originales.