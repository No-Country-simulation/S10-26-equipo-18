# Integración del frontend con los nuevos endpoints del backend

**Rama:** `feat/pablo/front`  
**Fecha:** 03/11/2026  
**Alcance:** conectar las pantallas existentes (`/`, `/leads`, `/nueva-busqueda`) con los
endpoints de leads, escaneos asíncronos, dashboard y reanálisis incorporados en `dev`.

## 1. Modo dual (backend real / demo)

La app decide la fuente de datos con `NEXT_PUBLIC_API_URL`:

| Situación | Fuente |
| --- | --- |
| `NEXT_PUBLIC_API_URL` definida (ej. `http://127.0.0.1:8000`) | FastAPI real en todas las pantallas |
| Variable vacía o ausente | `mockBaseQuery` con el dataset local |

`NEXT_PUBLIC_API_URL` debe apuntar al **origen** del backend, sin `/api`
(el front lo agrega). Este modo dual mantiene funcionando la demo de Vercel
aunque no haya backend disponible.

## 2. Endpoints integrados

| Endpoint | Uso en el front |
| --- | --- |
| `GET /api/leads/` | Listado de leads (`useGetLeadsQuery`) |
| `GET /api/leads/filtros` | Opciones de ciudad/rubro en `LeadFilters` |
| `GET /api/leads/{id}` | Detalle del lead en `LeadDrawer` |
| `PATCH /api/leads/{id}` | Cambio de estado comercial |
| `POST /api/leads/{id}/reanalyze` | Botón “Reanalizar” del detalle |
| `GET /api/dashboard` | KPIs y gráficos del tablero |
| `POST /api/scans` | Inicio de escaneo (202) |
| `GET /api/scans` | Historial de escaneos |
| `GET /api/scans/{id}` | Polling del estado del escaneo |

Los contratos en snake_case se traducen a los tipos del front en:

- `Front/lib/mappers/leads.ts`
- `Front/lib/mappers/scans.ts`
- `Front/lib/mappers/dashboard.ts`

## 3. Flujo de escaneo asíncrono

1. `useCreateScanMutation` envía `POST /api/scans` con el cuerpo snake_case:

   ```json
   {
     "ciudad": "Bogotá",
     "rubro": "Restaurantes",
     "max_resultados": 2,
     "rating_min": 1.5,
     "rating_max": 3.5,
     "resenas_min": 10
   }
   ```

2. El backend responde **202** con `{ id, estado: "en_progreso", mensaje }`.
   Ese 202 **no** se trata como escaneo terminado.
3. El front consulta `GET /api/scans/{id}` cada **2,5 s** hasta `completado` o
   `fallido`, con timeout de **6 minutos** y cancelación vía `api.signal` al
   desmontar o abortar la mutación.
4. Al completar, RTK Query invalida `Leads`, `Dashboard`, `Scans` y `Filtros`.
5. Si el backend responde `fallido`, la UI muestra el error y no queda cargando.

En modo mock se conserva el flujo anterior (`/api/scan` + scraper local).

## 4. Reglas de datos respetadas

- `problema_ia = null` → se muestra **“Sin analizar”** (no se reemplaza por
  `atencion`).
- `resenas[].fecha = null` → **“Fecha no disponible”**.
- `draft_asunto/cuerpo` ausentes → no se inventa un borrador; se explica que el
  backend todavía no lo generó.
- `ultimo_escaneo = null` → **“Fecha no disponible”**, no la fecha de hoy.
- `estado` comercial distinto de `nuevo` no implica `actualizado`; el backend no
  expone ese dato por lead y se deja en `false`.
- Filtros no soportados por el backend (`search`, `problema`, `severidad`,
  `canal`, `sort`) se aplican en cliente reutilizando `aplicarFiltros`.
- Severidad alineada con el backend: `≤ 2.0` crítica, `≤ 3.0` riesgo, resto
  vigilancia.
- El dashboard ya no muestra la métrica ficticia `totalLeads * 3`; se reemplazó
  por “Leads sin clasificar”, derivada de los datos reales.

## 5. Límites actuales del backend reflejados en la UI

- El scraper real solo opera con **Google Maps**; en modo backend las demás
  plataformas quedan deshabilitadas con una aclaración.
- `max_resultados` acepta **1–5** (control explícito en el formulario).
- `rating_min` se envía fijo en **1.5**; el usuario ajusta `rating_max`.
- `resenas_min` acepta **≥ 0** (default 10).
- El backend filtra por `ciudad`, `rubro`, `rating_min`, `rating_max` y `estado`.

## 6. Cómo probar localmente

```powershell
# 1) Backend + PostgreSQL (Docker)
docker compose up -d
cd Back
uvicorn app.main:app --reload

# 2) Frontend
cd Front
# .env.local: NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
npm run dev
```

Verificar en la pestaña **Network**:

- `GET /api/leads/` → 200 con snake_case.
- `POST /api/scans` → **202** con `id` y `estado: en_progreso`.
- `GET /api/scans/{id}` → repetido hasta `completado`/`fallido`.
- `PATCH /api/leads/{id}` → 200 y estado persistido.
- `POST /api/leads/{id}/reanalyze` → 200, o 422 sin reseñas / 503 si Gemini falla.

## 7. Checklist de QA cubierto

- [x] Listado sin duplicar leads del scanner local (el backend ya persiste).
- [x] El 202 no se interpreta como completado; hay polling con timeout.
- [x] Fechas, problemas y borradores nulos no se completan con datos ficticios.
- [x] El historial muestra rango de rating (`rating_min`–`rating_max`), estado y
      duración (`—` cuando es nula).
- [x] Tras `PATCH` se invalida el detalle, el listado y el dashboard.
- [x] Filtros de ciudad/rubro salen de `GET /api/leads/filtros`.
- [x] Errores de FastAPI (`detail`) se muestran en la UI.
- [x] `npm run typecheck` y `npm run build` pasan.

## 8. Pendiente de verificación en vivo

Al momento de este cambio Docker Desktop estaba apagado (sin PostgreSQL en
`:5433`) y el backend no estaba corriendo. La integración se validó con
typecheck/build y con los contratos leídos del código, pero falta ejecutar el
flujo real `POST /api/scans` → polling → refresco visual contra FastAPI.
