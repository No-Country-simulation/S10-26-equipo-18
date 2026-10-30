# Conexión con Backend - /leads

Este cambio conecta únicamente la pantalla **/leads** con el backend FastAPI levantado localmente, manteniendo el resto de la aplicación con el flujo mock actual.

## Objetivo

Conectar el listado, detalle y cambio de estado de leads al backend real, adaptando el contrato del API al modelo de datos que ya utiliza el frontend.

## Cambios realizados

### Backend
- **`Back/app/main.py`**: Se agregó `CORSMiddleware` para habilitar peticiones desde el frontend.
  - Orígenes permitidos: `http://localhost:3000`, `http://localhost:3001`, `https://s10-26-equipo-18.vercel.app`
  - `allow_credentials: true`, `allow_methods: ["*"]`, `allow_headers: ["*"]`
- **`Back/README_CORS.md`**: Documentación del cambio de CORS.

### Frontend
- **`Front/.env.local`**: Agregado `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000` para apuntar al backend.
- **`Front/lib/mappers/leads.ts`**: Nuevo mapper para traducir el contrato del backend al tipo `Lead` del front.
  - `rating` (string) → `number`
  - `problema_ia` → `problema`, `confianza_ia` → `confianzaIA`
  - `vendedor_id` (`usr-001/002/003`) → `ven-01/02/03`
  - `draft_asunto`/`draft_cuerpo` → `draft` (con fallback si no vienen)
  - `resenas`/`reviewsNegativas` → array vacío si no vienen
- **`Front/store/api/leadsApi.ts`**: Adaptado para usar backend real solo en `/leads`.
  - `GET /api/leads/` (array directo) → mapeado a `LeadListResponse`
  - `GET /api/leads/{id}` → mapeado con transformResponse
  - `GET /api/leads/filtros` → conectado al endpoint de filtros
  - `PATCH /api/leads/{id}` → para actualizar estado comercial
  - `getDashboard`, `getScans` y `createScan` **sigue usando mockBaseQuery** (no se tocaron)
- **Console logs** agregados temporalmente para validar mapeo y respuesta del API.

## Endpoints conectados

| Endpoint | Uso |
|---|---|
| `GET /api/leads/` | Listado de leads en `/leads` |
| `GET /api/leads/filtros` | Filtros dinámicos de ciudad/rubro |
| `GET /api/leads/{lead_id}` | Detalle para `LeadDrawer` |
| `PATCH /api/leads/{lead_id}` | Cambio de estado del lead |

## Lo que NO se tocó

- **`/nueva-busqueda`**: Sigue usando `POST /api/scan` de Next.js + `repusense_scraper.py`
- **`/` (Dashboard)**: Sigue usando datos mock. No se conecta a `/api/dashboard` ya que aún no existe en el backend
- **Login/Auth**: Sin cambios
- **Scraper local**: Sin cambios

## Pruebas realizadas

- Listado de leads cargando correctamente desde `http://127.0.0.1:8000/api/leads/`
- Mapeo correcto de `rating`, `problema`, `estado`, `vendedor`
- `lead-002` con `vendedor_id: usr-001` mapeado a `ven-01` (Valeria Ríos)
- Dashboard vuelve a funcionar con datos mock
- `/nueva-busqueda` sin afectaciones

## Notas

- El backend no trae `resenas` ni `draft_asunto/draft_cuerpo` aún, por lo que se muestran vacíos/fallback. Cuando se agreguen al `LeadResponse`, el mapper los aprovechará automáticamente.
- Se requiere tener Postgres levantado con `docker compose up -d postgres` y FastAPI corriendo con `uvicorn app.main:app --reload` desde `Back/`.
