
## 2. Registro de Defectos y Bloqueos (Seguimiento GitHub Project #550)

| Fecha Referencia | Caso / HU | Descripción del Defecto / Bloqueo | Estado | PR Asociado |
| :--- | :--- | :--- | :--- | :--- |
| 20/10/2026 | #23 | La funcionalidad de escaneo radar no está operativa en el despliegue de Vercel debido a que el frontend aún no está conectado al backend. Localmente, el frontend funciona con limitaciones y datos mock mientras se completa la integración. | Closed 27/10 | Resuelto |
| 20/10/2026 | #25 | El botón «Lanzar escaneo radar» no ejecuta la acción esperada desde el Dashboard. | Closed 27/10 | Resuelto |
| 20/10/2026 | #24 | Validar filtros de búsqueda por radar (puntuación de 1.5 a 3.5 estrellas, igual o mayor a 10 reseñas) bloqueado por error de despliegue. | Closed 27/10 | Resuelto |
| 24/10/2026 | #34 | Tras el arreglo del botón «Lanzar escaneo radar», la superficie interactiva no cubre todo el botón; solo responde al hacer clic en la zona izquierda. | Closed 27/10 | Resuelto |
| 03/11/2026 | Radar / Scraper | Escaneos completados con `total = 0`: el filtro de rating (≤3.5) descarta los 20 primeros resultados de Google Maps, que suelen tener ratings altos. Detalle y opciones de solución en [ISSUE_LEADS_SIN_RESULTADOS.md](./ISSUE_LEADS_SIN_RESULTADOS.md). | Open | Pendiente de decisión |
| 06/11/2026 | Nueva Búsqueda / Integración E2E | Durante la prueba de integración del despliegue Vercel–Render, se verifica la conexión entre frontend y backend, la carga del Dashboard y de los leads, y el registro del escaneo mediante `POST /api/scans`. Sin embargo, al iniciar una nueva búsqueda, la ejecución finaliza con estado `failed` aproximadamente a los 4 segundos. El frontend informa: «El escaneo terminó con estado fallido. Revisá los logs del backend». El flujo de extracción y generación de nuevos resultados permanece bloqueado. Se requiere analizar los logs del backend y verificar la configuración de ejecución de Playwright/Chromium y los recursos disponibles en Render. Causa raíz aún no confirmada. | Open | Pendiente de diagnóstico |
