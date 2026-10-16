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
│  ├─ auth/                      # LoginForm, RadarAnimation, AuthGuard, AuthHydrator
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
│  └─ mock/dataset.ts            # Dataset de demo (214 leads + 8 scans) y cálculos
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

1. **Login** (`/login`) — acceso + animación de radar de fondo.
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
