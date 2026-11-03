# RepuSense — Guía para probar la integración del frontend con el backend local

**Destinatarios:** equipo Frontend y QA  
**Rama del backend:** `feat/lourdes/integracion-scraper`  
**Estado actual:** scraper real y API integrados con PostgreSQL **local**. La conexión con Supabase y el flujo completo desde el frontend todavía están pendientes de validación.

## 1. Objetivo

Probar desde el frontend existente los endpoints de FastAPI, iniciar un escaneo real de Google Maps y comprobar que los leads se guardan y se consultan correctamente. **No hace falta rediseñar la interfaz**: se trata de conectar sus acciones actuales a la API.

> **Importante:** la base PostgreSQL que utiliza actualmente el backend está en la computadora de la desarrolladora backend. Cada integrante que ejecute FastAPI en su propia computadora necesita una base PostgreSQL con el esquema correspondiente, o esperar a la futura conexión compartida con Supabase. No alcanza con clonar el repositorio para acceder a los datos de esa base local.

## 2. Requisitos previos

- Repositorio del equipo con los cambios de la rama del backend disponibles.
- Python y Node.js instalados; PostgreSQL accesible y con las tablas del proyecto.
- Dependencias Python instaladas, Chromium de Playwright y credenciales de Gemini configuradas.
- Dos terminales: una para FastAPI y otra para Next.js.
- Conexión a internet para Google Maps y Gemini.

**Seguridad:** no subir archivos `.env`, contraseñas ni claves de Gemini al repositorio. Solicitar los nombres exactos de las variables y el esquema de BD al equipo backend; no copiar credenciales de otras personas.

## 3. Preparar y ejecutar el backend

Desde la raíz del repositorio, en PowerShell:

```powershell
cd Back
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m playwright install chromium
```

Crear o completar `Back/.env` **según las variables que efectivamente lee el código del proyecto**. Como mínimo, debe existir una conexión PostgreSQL válida y la configuración de Gemini necesaria para el análisis. No se documenta aquí un nombre concreto de variable de BD para evitar indicar uno incorrecto: comprobarlo en la configuración del backend.

Luego iniciar:

```powershell
uvicorn app.main:app --reload
```

Comprobar:

- Salud de la API: http://127.0.0.1:8000/health
- Documentación interactiva: http://127.0.0.1:8000/docs
- Historial de escaneos: http://127.0.0.1:8000/api/scans

**Nota:** que `/health` responda no garantiza que la conexión a PostgreSQL esté funcionando. Verificar también un endpoint que consulte datos.

## 4. Conectar el frontend existente

En `Front/.env.local`, colocar:

```dotenv
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Desde otra terminal:

```powershell
cd Front
npm install
npm run dev
```

Abrir http://localhost:3000 (o el puerto informado por Next.js).

El frontend ya utiliza RTK Query y contempla `NEXT_PUBLIC_API_URL`: con esta variable configurada debe consumir la API real en lugar de la fuente mock, sujeto a las adaptaciones de mapeo pendientes. Reiniciar Next.js después de modificar `.env.local`.

> `NEXT_PUBLIC_API_URL` debe apuntar al **origen del backend** (sin agregar `/api`), porque la configuración actual del frontend ya añade `/api`.

## 5. Probar primero la API, sin depender de la pantalla

Abrir http://127.0.0.1:8000/docs y probar estos endpoints en orden:

| Método | Ruta | Qué verificar |
| --- | --- | --- |
| `GET` | `/api/leads/` | Responde con los leads almacenados. |
| `GET` | `/api/leads/filtros` | Devuelve ciudades y rubros disponibles. |
| `GET` | `/api/dashboard` | Devuelve métricas para el tablero. |
| `GET` | `/api/scans` | Devuelve el historial de escaneos. |
| `POST` | `/api/scans` | Registra e inicia un escaneo real. |
| `GET` | `/api/scans/{id}` | Permite consultar el avance y resultado. |

### Ejemplo para iniciar un escaneo

En Swagger (`/docs`), ejecutar `POST /api/scans` con:

```json
{
  "ciudad": "Buenos Aires",
  "rubro": "clinicas",
  "max_resultados": 2,
  "rating_min": 1.5,
  "rating_max": 3.5,
  "resenas_min": 10
}
```

**Respuesta inicial esperada:** HTTP `202 Accepted`, con estructura semejante a:

```json
{
  "id": "uuid-del-escaneo",
  "estado": "en_progreso",
  "mensaje": "Escaneo registrado e iniciado"
}
```

Guardar el `id` y consultar `GET /api/scans/{id}` hasta que `estado` sea `completado` o `fallido`. La respuesta `202` **no** significa que el escaneo haya terminado.

Cuando termine, revisar `GET /api/leads/`, `GET /api/scans` y `GET /api/dashboard`. Un escaneo puede terminar con cero resultados sin que eso signifique un error.

**Limitaciones actuales del formulario:** `max_resultados` admite de 1 a 5; `rating_min` y `rating_max` deben estar entre 0 y 5 y cumplir mínimo ≤ máximo; `resenas_min` debe ser ≥ 0. El scraper real implementado trabaja con **Google Maps**, no con Yelp o TripAdvisor.

## 6. Conectar el escáner del frontend

La integración debe adaptarse a los componentes ya desarrollados por Frontend:

1. Conectar la acción de iniciar escaneo a `POST /api/scans`.
2. Convertir los nombres de campos de la interfaz al contrato de FastAPI, por ejemplo `ratingMax` → `rating_max` y `resenasMin` → `resenas_min`. Enviar también `rating_min` y `max_resultados`.
3. Guardar el `id` devuelto por la API.
4. Consultar `GET /api/scans/{id}` periódicamente mientras el estado sea `en_progreso`. Detener las consultas en un estado final o al abandonar el componente.
5. Al completar, actualizar las consultas de leads, dashboard e historial (invalidación/refetch en RTK Query).
6. Integrar los errores con los componentes de notificación ya existentes, sin cambiar innecesariamente la interfaz.

**Diferencia de contrato importante:** el tipo `ScanResult` actual del frontend espera un objeto con `scan` y contadores; el `POST` real devuelve inicialmente solo `id`, `estado` y `mensaje`. Se recomienda un tipo específico para esa respuesta y obtener los contadores desde `GET /api/scans/{id}`.

### Mapeo de campos del historial

| Backend | Frontend |
| --- | --- |
| `rating_min` | Campo equivalente a incorporar si se visualiza |
| `rating_max` | `ratingMax` |
| `resenas_min` | `resenasMin` |
| `duracion_seg` | `duracionSeg` |
| `plataformas` | `plataformas` |
| `nuevos`, `actualizados`, `total` | Mismos nombres |
| `estado`, `fecha` | Mismos nombres |

En detalles de leads, una reseña puede tener `fecha: null`; mostrar «Fecha no disponible». No completar fechas o resultados de IA ausentes con valores ficticios.

## 7. Pruebas recomendadas para Frontend y QA

| Caso | Acción | Resultado esperado |
| --- | --- | --- |
| Conectividad | Abrir `/health` y `/api/scans` | API responde y PostgreSQL está accesible. |
| Listado | Abrir pantalla de leads | Se muestran datos reales de `/api/leads/`, sin duplicados con mocks. |
| Inicio | Iniciar escaneo con filtros válidos | Se recibe `202` y un ID real. |
| Seguimiento | Consultar el ID | El estado pasa de `en_progreso` a `completado` o `fallido`. |
| Actualización | Finalizar un escaneo | Se refrescan leads, dashboard e historial. |
| Validación | Enviar `max_resultados: 6` | API responde `422`; la interfaz informa el error. |
| Validación | Enviar `rating_min > rating_max` | API responde `422`. |
| Repetición | Escanear nuevamente la misma búsqueda | No se duplican leads equivalentes; se actualizan cuando corresponde. |
| Reseñas | Abrir detalle con `fecha: null` | No falla el render ni se inventa una fecha. |
| Estados | Cambiar estado comercial de un lead | El cambio persiste después de recargar. |
| Error externo | Scraper o IA falla | La interfaz informa el fallo y no queda cargando indefinidamente. |

## 8. Problemas frecuentes

**El frontend muestra datos mock:** comprobar `NEXT_PUBLIC_API_URL`, reiniciar Next.js y revisar la pestaña *Network* del navegador.

**Error CORS:** verificar que FastAPI permita el origen real del frontend (`http://localhost:3000` o `http://localhost:3001`).

**Error 404:** revisar la ruta solicitada y que el backend incluya los routers correspondientes. Consultar `/docs`.

**Error 500 al consultar leads o escaneos:** comprobar la conexión PostgreSQL y que las tablas coincidan con los modelos. No asumir que Supabase ya está conectado.

**No se abre Chromium:** ejecutar `python -m playwright install chromium` dentro del entorno virtual correspondiente.

**El escaneo demora:** es normal que Playwright y Gemini tarden. La interfaz debe consultar el estado, no esperar que el `POST` devuelva todos los leads.

**El escaneo no termina:** revisar logs de FastAPI. `BackgroundTasks` no es una cola durable; si se reinicia el proceso, la ejecución puede interrumpirse.

**Vercel marca fallo de despliegue:** es un problema de build/deploy que debe revisarse en sus logs; no confirma por sí mismo un fallo del scraper local.

## 9. Estado y alcance de esta guía

- **Verificado en backend local:** ejecución de scraper real, persistencia de leads, consulta de historial y dashboard, detalle y reanálisis de leads.
- **Pendiente de comprobar en conjunto:** formulario de React → `POST /api/scans` → seguimiento → refresco visual.
- **Pendiente para entorno compartido:** conectar la API a Supabase y validar compatibilidad de tablas, credenciales y controlador PostgreSQL.
- **No incluido en el scraper actual:** otras plataformas distintas de Google Maps.

### Qué compartir si aparece un error

Informar: endpoint, método HTTP, código de respuesta, cuerpo del error **sin secretos**, pasos para reproducirlo y líneas relevantes del log de FastAPI. Para errores de frontend, agregar captura de *Network* o consola sin exponer claves.
