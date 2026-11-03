# RepuSense — Frontend (Radar de Reputación en Crisis)

Frontend del producto **RepuSense**: un radar de prospección B2B que detecta negocios
locales con mala reputación online, clasifica el problema principal con IA y genera el
primer contacto de venta.

> Este proyecto es la app web (UI). El backend aún no está implementado: por ahora la UI
> funciona con **datos mock** que respetan el esquema de salida del scraper
> (`Guia/leads_buenos_aires.json`). Cuando el backend exista, se conecta sin tocar la UI
> (ver sección "Conectar el backend").

---

## 1. Stack

| Capa | Tecnología |
| --- | --- |
| Framework | **Next.js 14** (App Router, React 18, TypeScript) |
| Estilos | **Tailwind CSS 3** (tokens tomados de `Guia/stitch_.../DESIGN.md`) |
| Estado global | **Redux Toolkit** |
| Data fetching / cache | **RTK Query** |
| Gráficos | **Recharts** |
| Fuentes | `next/font` → Space Grotesk (display), Inter (UI), JetBrains Mono (logs) |

---

## 2. Cómo correr el proyecto

```bash
cd Front
npm install
npm run dev        # http://localhost:3000
```

Otros scripts:

```bash
npm run build      # build de producción
npm run start      # sirve el build
npm run lint       # ESLint (Next)
npm run typecheck  # tsc --noEmit
```

El login es **demo**: cualquier email/contraseña entra. El operador se asigna según el
email (ver `lib/constants.ts` → `VENDEDORES`), por defecto `valeria.rios@repusense.io`.
Además, la pantalla de login incluye un **acceso rápido de un clic** para cada uno de los
tres vendedores, mostrando su nombre, rol y email corporativo.

### 2.1 Datos reales desde el scraper

El front ya viene con los datos que generó el scraper, commiteados en
`lib/mock/leads.generated.json` (**110 leads** de 8 ciudades y 6 rubros). No hay que
correr nada para verlos: `npm run dev` los levanta automáticamente.

Para **regenerarlos** con el scraper:

```bash
npm run scrape
```

- Corre `Guia/repusense_scraper.py` para 11 combinaciones de ciudad/rubro y junta
  todo en `lib/mock/leads.generated.json`.
- `lib/mock/dataset.ts` importa ese JSON y lo usa como fuente de datos (si el archivo
  no existiera, cae a un dataset sintético de respaldo).
- **Requiere Python 3** instalado (el scraper no usa dependencias externas, no hace
  falta `pip install`). Si tu intérprete es `py`, usá: `PYTHON=py npm run scrape`.
- Para ampliar el dataset, agregá más combos en `scripts/scrape.mjs`.

### 2.2 El formulario de "Nueva Búsqueda" corre el scraper

La pantalla **Nueva Búsqueda** no simula: al apretar *Lanzar escaneo radar* envía
`ciudad`, `rubro`, plataformas, rating y reseñas al endpoint `POST /api/scan`
(`app/api/scan/route.ts`), que ejecuta el scraper de Python con esos parámetros y
devuelve los leads. Estos se agregan/actualizan en la app y se invalidan `Dashboard`,
`Leads` y `Scans`, así que el panel y la lista se refrescan solos.

- Es una **API Route de Next** (corre en el servidor Node del propio front, no hace
  falta un backend aparte). Sigue requiriendo **Python 3** en la máquina que sirve la app.
- Si el mismo negocio ya existe (mismo nombre + ciudad), se marca como **actualizado**
  en vez de duplicarse; el resto entra como lead **nuevo** en estado `nuevo`.
- **Reglas de captura:** calificación entre **1.5 y 3.5 ★** (ambos inclusive) y
  **10 reseñas o más** (el negocio puede tener hasta 600). De cada negocio se
  registran sus **5 reseñas negativas** (1–3 ★) para el análisis de IA.

> Nota: el scraper es una **simulación** de extracción (genera negocios de muestra con
> la forma real de los datos), no hace scraping real de Google Maps.

---

## 3. Estructura de carpetas

```
Front/
├─ app/                          # App Router (rutas y layouts)
│  ├─ layout.tsx                 # <html>, fuentes y metadata
│  ├─ providers.tsx              # Redux Provider + hidratación de sesión (client)
│  ├─ globals.css                # Tailwind + estilos base + scrollbar/animaciones
│  ├─ login/page.tsx             # Pantalla 1: inicio de sesión + animación radar
│  └─ (dashboard)/               # Grupo protegido (comparte Sidebar/Topbar)
│     ├─ layout.tsx              # AuthGuard + AppShell (shell autenticado)
│     ├─ page.tsx                # "/"         → Pantalla 2: Panel de Control / Radar
│     ├─ nueva-busqueda/page.tsx # "/nueva-busqueda" → Pantalla 3: params + monitor
│     └─ leads/page.tsx          # "/leads"    → Pantalla 4: explorador de leads
│
├─ components/                   # UI reutilizable
│  ├─ auth/                      # LoginForm, QuickLogin, RadarAnimation, AuthGuard, AuthHydrator
│  ├─ layout/                    # Sidebar, Topbar, AppShell, nav.ts (config de menú)
│  ├─ config/ConfigModal.tsx     # Modal global: operador, reglas, conexión backend
│  ├─ dashboard/ScanHistory.tsx  # Historial de escaneos
│  ├─ charts/                    # ProblemBarChart, SeverityDonut (Recharts)
│  ├─ leads/                     # LeadFilters, LeadsTable, LeadDrawer
│  ├─ search/RadarMonitor.tsx    # Terminal de logs en vivo + resumen del escaneo
│  └─ ui/                        # Primitivas: Button, Card, Chip, badges, icons, KpiCard
│
├─ lib/                          # Lógica sin React
│  ├─ types.ts                   # Modelos: Lead, Scan, Vendedor, DashboardStats, ...
│  ├─ constants.ts               # Categorías, ciudades, rubros, estados, vendedores
│  ├─ format.ts                  # Helpers de formato + clasificación de severidad
│  ├─ csv.ts                     # Exportación a CSV
│  ├─ cn.ts                      # Helper de clases
│  ├─ mock/dataset.ts            # Fuente de datos: importa el JSON del scraper (+ respaldo)
│
├─ store/                        # Redux Toolkit + RTK Query
│  ├─ index.ts                   # makeStore + tipos RootState/AppDispatch
│  ├─ provider.tsx               # <Provider> con store por instancia
│  ├─ hooks.ts                   # useAppDispatch / useAppSelector tipados
│  ├─ slices/authSlice.ts        # Sesión del operador
│  ├─ slices/uiSlice.ts          # Filtros de leads, drawer seleccionado, modal config
│  └─ api/
│     ├─ leadsApi.ts             # createApi + endpoints (RTK Query)
│     └─ mockBaseQuery.ts        # Base query "mock" (in-memory) para modo demo
│
├─ scripts/scrape.mjs            # Orquestador del scraper (npm run scrape)
├─ public/favicon.svg
├─ tailwind.config.ts            # Tokens de diseño (colores, fuentes, animaciones)
└─ tsconfig.json                 # Alias "@/*" → raíz de Front/
```

---

## 4. Flujo de datos (RTK Query)

Toda la UI de datos pasa por `store/api/leadsApi.ts`. Los componentes **no** llaman a
`fetch` directamente: usan los hooks generados.

```
Componente  →  hook (useGetLeadsQuery, etc.)  →  baseQuery  →  datos
                                                   │
                                       NEXT_PUBLIC_API_URL definida?
                                         ├─ Sí  → fetchBaseQuery contra la API real
                                         └─ No  → mockBaseQuery (dataset en memoria)
```

Endpoints disponibles:

| Hook | Uso |
| --- | --- |
| `useGetLeadsQuery(filtros)` | Tabla de leads + KPIs del listado |
| `useGetLeadQuery(id)` | Ficha de un lead (drawer) |
| `useGetDashboardQuery()` | KPIs y distribuciones del radar |
| `useGetScansQuery()` | Historial de escaneos |
| `useUpdateLeadMutation` | Cambiar estado del lead en el pipeline |
| `useCreateScanMutation` | Lanzar un escaneo (pantalla Nueva Búsqueda) |

Los tags (`Leads`, `Lead`, `Dashboard`, `Scans`) invalidan y refrescan la cache
automáticamente: al cambiar un estado o lanzar un escaneo, las vistas se actualizan solas.

---

## 5. Estado global (Redux)

- **`auth`** — operador logueado (`vendedorId`, `hydrated`). Persistido en
  `localStorage` (`repusense.vendedor`) por `AuthHydrator`.
- **`ui`** — filtros del explorador de leads, lead seleccionado (drawer) y visibilidad
  del modal de configuración.
- **`leadsApi`** — cache de RTK Query.

---

## 6. Pantallas implementadas (según los diseños de `Guia/stitch_...`)

1. **Login** (`/login`) — acceso con credenciales, acceso rápido de vendedores + animación de radar de fondo.
2. **Panel de Control** (`/`) — KPIs, distribución de problemas, semáforo de severidad,
   top ciudades, rubros, contactabilidad e historial de escaneos.
3. **Nueva Búsqueda** (`/nueva-busqueda`) — parámetros (ciudad, rubro, plataformas,
   umbral de rating y reseñas mínimas) + terminal de ejecución en vivo.
4. **Leads** (`/leads`) — tabla con filtros combinables, orden, exportación CSV y drawer
   de prospección con reseñas negativas y draft de email IA.

La configuración (operador, reglas, conexión backend) vive en un **modal global**
(`ConfigModal`) accesible desde el Sidebar/Topbar.

---

## 7. Conectar el backend

1. Crear `.env.local` en `Front/` con la URL de la API:

   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```

2. Con eso, `leadsApi` deja de usar `mockBaseQuery` y consulta la API real. Los
   endpoints y formas de respuesta esperados son los que ya define
   `lib/types.ts` (`LeadListResponse`, `DashboardStats`, `Scan`, ...).

   Se recomienda que el backend exponga:

   | Método | Ruta | Devuelve |
   | --- | --- | --- |
   | GET | `/leads` | `LeadListResponse` (acepta los filtros del explorador) |
   | GET | `/leads/:id` | `Lead` |
   | PUT | `/leads/:id` | `Lead` (actualizado) |
   | GET | `/dashboard` | `DashboardStats` |
   | GET | `/scans` | `Scan[]` |
   | POST | `/scans` | `ScanResult` |

3. Mientras no exista, toda la app funciona en **modo demo** con datos mock. El modal de
   configuración muestra el estado de la conexión y permite restablecer los datos demo.

---

## 8. Esquema de datos (contrato con el scraper)

El front consume el mismo esquema que genera `Guia/repusense_scraper.py` /
`Guia/leads_buenos_aires.json` (ver `lib/types.ts` → `Lead`):

```ts
{
  id, nombre, rubro, ciudad, fuente, rating, numResenas,
  telefono, web, email, linkedin,
  problema,            // atencion | precios | higiene | demoras | calidad | citas
  confianzaIA,         // 0..100
  reviewsNegativas: [{ autor, fecha, texto, estrellas }],
  draft: { asunto, cuerpo },
  estado,              // nuevo | contactado | convertido | perdido
  actualizado, ultimoEscaneo, vendedor
}
```

---

## 9. Notas de diseño

Los tokens (colores, tipografías, sombras, animaciones) se centralizaron en
`tailwind.config.ts` a partir de `Guia/.../repusense_tactical_radar/DESIGN.md`:

- Fondos: `bg #070b14`, `surface #0a0f1c`, `sidebar #080d19`, bordes `#1e293b`.
- Acento: teal `#14b8a6` / glow `#2dd4bf`.
- Severidad: crítica `#f43f5e`, riesgo `#f59e0b`, vigilancia `#10b981`.
- Dolor IA: 6 colores (atención, precios, higiene, demoras, calidad, citas).
