# RepuSense

## Guía de integración Frontend + plan de validación QA

NoCountry · Simulación laboral | Equipo 18 | 02/11/2026

Documento de transferencia técnica · Rama: feat/lourdes/integracion-scraper · Destino: dev

## 1. Resumen ejecutivo

La rama incorpora extracción real de negocios de Google Maps mediante Playwright, análisis de reseñas con Gemini, persistencia y deduplicación en PostgreSQL, endpoints de leads, escaneos asíncronos y estadísticas de dashboard. El frontend ya muestra leads del backend combinados con su escáner local, pero todavía debe conectar el formulario de escaneos al proceso real de FastAPI.

Estado de validación: GET /api/scans y GET /api/dashboard devolvieron 200 en pruebas locales; el detalle y reanálisis de un lead también fueron probados. No se ha validado aún el flujo completo del formulario de React con POST /api/scans. El PR no presenta conflictos, pero su check de despliegue en Vercel figura fallido y requiere revisar logs antes de fusionar.

## 2. Funcionalidades incorporadas

| Componente   | Comportamiento                                                                             | Consideraciones                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| Scraper      | Extrae negocios, ratings, cantidad de reseñas y reseñas negativas desde Google Maps.       | Playwright síncrono se ejecuta en hilo; sujeto a cambios de interfaz y restricciones del sitio.      |
| Gemini       | Clasifica problemas y genera borrador comercial; reanálisis a partir de reseñas guardadas. | Puede haber reintentos y respuestas de contingencia; no presentar texto como verificado por humanos. |
| Persistencia | Upsert de leads y reseñas con deduplicación; preserva estado comercial.                    | Reescaneos actualizan información sin crear duplicados previstos.                                    |
| Escaneos     | Registro, procesamiento en segundo plano, consulta de estado e historial.                  | POST responde 202 inmediatamente; no devuelve leads al instante.                                     |
| Dashboard    | Estadísticas de leads y distribuciones por problema, ciudad, rubro y severidad.            | Revisar definiciones de métricas y normalización de rubros.                                          |

## 3. Contrato de API disponible

| Método y ruta                  | Uso                            | Respuesta / observación                                           |
| ------------------------------ | ------------------------------ | ----------------------------------------------------------------- |
| GET /api/leads/                | Listado de leads               | Datos de API en snake_case; frontend utiliza mapper.              |
| GET /api/leads/filtros         | Ciudades y rubros              | Usar para filtros disponibles.                                    |
| GET /api/leads/{id}            | Detalle de lead                | Incluye resenas y borrador de email cuando existen.               |
| PATCH /api/leads/{id}          | Actualizar estado comercial    | Estados: nuevo, contactado, convertido, perdido.                  |
| POST /api/leads/{id}/reanalyze | Reanalizar reseñas almacenadas | Puede responder 422 sin reseñas o 503 por falla de IA.            |
| GET /api/dashboard             | Métricas del tablero           | Respuesta en camelCase según contrato implementado.               |
| POST /api/scans                | Iniciar scraping real          | 202; devuelve id, estado en_progreso, mensaje.                    |
| GET /api/scans                 | Historial de hasta 50          | Lista de escaneos, más recientes primero.                         |
| GET /api/scans/{id}            | Consultar estado y resultado   | 404 si el ID no existe.                                           |
| POST /api/scraper/test         | Prueba directa de extracción   | Ruta de prueba; evitar usarla como operación principal del front. |

## 4. Integración del escáner real en React

Solicitud esperada por POST /api/scans (JSON):

```text
{
  "ciudad": "Buenos Aires",
  "rubro": "clinicas",
  "max_resultados": 2,
  "rating_min": 1.5,
  "rating_max": 3.5,
  "resenas_min": 10
}
```

Validaciones backend: ciudad y rubro de 2 a 100 caracteres; max_resultados entre 1 y 5; ratings entre 0 y 5 con rating_min <= rating_max; resenas_min >= 0.

Respuesta inicial HTTP 202:

```text
{"id": "uuid-del-escaneo", "estado": "en_progreso", "mensaje": "Escaneo registrado e iniciado"}
```

La pantalla no debe tratar el 202 como escaneo completado. Debe conservar el ID, consultar GET /api/scans/{id} periódicamente y detener las consultas cuando estado sea completado o fallido. Tras completado, invalidar/refrescar leads, dashboard e historial. Evitar consultas indefinidas y cancelar el polling al desmontar la pantalla.

## 5. Compatibilidad entre el frontend existente y la API

- Mapear ScanRequest camelCase a snake_case: ratingMax → rating_max, resenasMin → resenas_min. El backend también recibe rating_min y max_resultados; definir controles o valores explícitos para ambos.
- El frontend tiene plataformas: string[]; el backend actualmente opera solo con Google Maps y persiste ["Google Maps"]. No presentar otras plataformas como operativas.
- Mapear la respuesta del historial: rating_max → ratingMax, resenas_min → resenasMin, duracion_seg → duracionSeg; fecha es ISO 8601. La API también expone rating_min.
- El tipo actual ScanResult del frontend espera {scan, nuevos, actualizados, total}, pero POST devuelve {id, estado, mensaje}. Definir un tipo ScanStartResponse y consultar el resultado después.
- Revisar GET /api/scans: en el frontend actual el queryFn consume el baseQuery real cuando NEXT_PUBLIC_API_URL está definido; transformar cada elemento al tipo Scan.
- Revisar URL base y slash final para evitar rutas mal concatenadas; confirmar solicitudes en Network del navegador.
- En detalle de lead, resenas[].fecha puede ser null; actualizar el tipo ReviewNegativa y mostrar «Fecha no disponible» en vez de inventar una fecha.
- No convertir problema_ia nulo en «atencion» automáticamente: mostrar «Sin analizar» o adaptar el tipo. Evitar generar borradores ficticios como si fueran resultados de Gemini.
- No sustituir ultimo_escaneo nulo por la fecha actual; mostrar dato no disponible. Evitar interpretar estado comercial distinto de «nuevo» como equivalente a «actualizado».
- Tras PATCH de estado, invalidar también la caché del detalle del lead, además del listado y dashboard.

## 6. Consideraciones para integrar el backend con el frontend existente

| Funcionalidad             | Consideraciones para la integración                                                                                                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Configuración del escaneo | Mantener el formulario existente y adaptar los parámetros enviados al contrato de `POST /api/scans`. Verificar que los filtros disponibles sean compatibles con los admitidos por el backend. |
| Inicio del escaneo        | Conectar la acción existente con `POST /api/scans`. El backend devuelve un identificador y el estado inicial `en_progreso`.                                                                   |
| Seguimiento               | Adaptar el mecanismo de seguimiento existente, si lo hubiera, para consultar `GET /api/scans/{id}` hasta obtener un estado final.                                                             |
| Resultados                | Al finalizar el escaneo, actualizar los datos mediante los endpoints de leads, dashboard e historial, aprovechando los componentes existentes.                                                |
| Manejo de errores         | Integrar los estados de error del backend con los mensajes y mecanismos de notificación que ya utiliza el frontend.                                                                           |
| Historial de escaneos     | Conectar el historial existente con `GET /api/scans`, adaptando los nombres de los campos cuando sea necesario.                                                                               |
| Datos locales y reales    | Revisar cómo se combinan los datos locales con los provenientes del backend para evitar duplicados o inconsistencias.                                                                         |

### Criterio de integración

Los cambios sugeridos son orientativos y deberán evaluarse junto con el responsable del frontend para determinar cuáles son necesarios.

El objetivo principal es conectar las funcionalidades existentes con los servicios reales del backend, evitando duplicar trabajo o introducir modificaciones innecesarias en la interfaz.

## 7. Matriz de pruebas para QA

| ID    | Escenario                                                 | Resultado esperado                                                                         |
| ----- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| QA-01 | GET /api/scans con registros                              | 200; lista con plataformas, ratings, resenas_min, estado, fecha, contadores, duracion_seg. |
| QA-02 | GET /api/scans/{id} existente / inexistente               | 200 con objeto / 404 respectivamente.                                                      |
| QA-03 | POST /api/scans válido                                    | 202, ID y en_progreso; aparece en historial y pasa a estado terminal.                      |
| QA-04 | POST inválido (rating_min > rating_max; max_resultados=6) | 422 con validación; no se crea escaneo.                                                    |
| QA-05 | Escaneo real con negocios encontrados                     | Persistencia de leads, contadores coherentes y consulta en GET /api/leads/.                |
| QA-06 | Repetir misma ciudad/rubro                                | No duplicar leads equivalentes; preservar estado comercial; actualizar datos observados.   |
| QA-07 | Escaneo sin resultados                                    | Completado con total=0, sin romper interfaz.                                               |
| QA-08 | Error en scraper o Gemini                                 | Estado fallido cuando corresponde; UI no queda indefinidamente cargando.                   |
| QA-09 | GET /api/leads/{id} con fecha de reseña null              | Render correcto sin fecha inventada ni error de tipos.                                     |
| QA-10 | POST reanalyze con/sin reseñas                            | Éxito con persistencia / 422 sin reseñas; gestionar 503 por IA.                            |
| QA-11 | PATCH estado y recarga                                    | Estado comercial persiste y se actualiza en listado, detalle y métricas.                   |
| QA-12 | Dashboard                                                 | Métricas coinciden con datos persistidos y categorías definidas.                           |
| QA-13 | Frontend + CORS desde localhost y despliegue              | Sin errores CORS ni 404; revisar Network y variables de entorno.                           |
| QA-14 | Build y deploy de Vercel                                  | Identificar y resolver check fallido antes de dar despliegue por aprobado.                 |

## 8. Datos de prueba y riesgos conocidos

- GET /api/scans fue probado con 7 registros, todos completados; algunos tienen total=0 y otros 1–2. Son datos de pruebas históricas, no evidencia de que React ya dispare escaneos reales.
- Existe un registro de ciudad «Bogot??» junto a «Bogotá»: revisar codificación/normalización para filtros y estadísticas.
- Hay escaneos históricos con resenas_min=11 y recientes con 10: respetar el valor almacenado; unificar defaults de modelo y esquema para futuras ejecuciones.
- Algunas duraciones registradas son 0 segundos en pruebas controladas; no inferir que el scraping real es instantáneo.
- Las fechas de reseñas extraídas no son confiables aún: el worker guarda fecha=null intencionalmente.
- El scraper utiliza Google Maps y puede verse afectado por antibots, selectores, cuotas o cambios externos. Usar dataset sintético para demos previsibles.
- La ejecución mediante FastAPI BackgroundTasks funciona para la prueba local; no equivale a una cola durable. Reinicios del proceso pueden interrumpir tareas; considerar worker/cola para producción.
- El check Vercel Deployment falló en el PR aunque GitHub informa «Able to merge». Revisar Build Logs con el responsable del despliegue. No asumir causa sin logs.
- Revisar Front/.env.local versionado: no debe contener secretos; exponer únicamente variables NEXT*PUBLIC* que realmente sean públicas. Rotar credenciales si alguna fue expuesta.
