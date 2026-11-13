# QA — RepuSense | Radar de Reputación en Crisis

## 1. Propósito de la documentación

Esta carpeta reúne los registros, análisis, matrices de prueba, evidencias y documentación técnica generados durante las actividades de Quality Assurance (QA) del proyecto **RepuSense — Radar de Reputación en Crisis**.

El objetivo del trabajo de QA es verificar la calidad funcional del producto, acompañar la evolución del desarrollo, detectar defectos tempranamente, evaluar la integración entre componentes y aportar información técnica que permita reducir riesgos antes de la entrega.

Las actividades comprenden:

- Seguimiento y validación incremental de funcionalidades.
- Análisis funcional y revisión de reglas de negocio.
- Diseño y documentación de casos de prueba.
- Pruebas manuales, exploratorias y automatizadas.
- Seguimiento de defectos y bloqueos.
- Verificación de integraciones entre frontend, backend y base de datos.
- Investigación de problemas de extracción, navegación y consumo de recursos.
- Análisis de evidencias y elaboración de propuestas de mejora.

## 2. Contexto del trabajo de QA

Durante las cuatro semanas de desarrollo, los componentes del sistema evolucionaron principalmente en ramas independientes.

Por este motivo, las primeras actividades de QA se realizaron sobre las funcionalidades disponibles en cada etapa, con el propósito de monitorear el avance, detectar inconsistencias y comunicar observaciones al equipo antes de la integración general.

Las pruebas automatizadas iniciales con Cypress también respondieron a este enfoque: verificar las funcionalidades que ya estaban desarrolladas, sin presuponer que el recorrido completo del producto se encontraba integrado.

La conexión entre los componentes se concretó posteriormente. A partir de esa integración comenzó a ser posible evaluar los problemas que aparecen cuando el sistema intenta ejecutar el flujo completo del radar.

**Importante:** la existencia de casos de prueba pendientes en la matriz no significa que no se hayan realizado actividades de QA. Los casos pendientes corresponden a escenarios que todavía no pudieron ejecutarse o validarse debido a los bloqueos del flujo integrado.

## 3. Alcance funcional del sistema

El flujo principal de RepuSense comprende:

1. Configuración de una búsqueda por ciudad, rubro y criterios de reputación.
2. Ejecución del escaneo sobre Google Maps.
3. Identificación y filtrado de negocios que cumplen los criterios.
4. Extracción de información y reseñas.
5. Enriquecimiento de datos de contacto.
6. Análisis de reputación mediante inteligencia artificial.
7. Persistencia de leads, reseñas y resultados del escaneo.
8. Visualización de información en el frontend.

El objetivo principal del producto es transformar opiniones digitales en información útil para detectar señales de crisis de reputación y facilitar decisiones comerciales.

Por lo tanto, la capacidad de realizar búsquedas y obtener leads válidos constituye una funcionalidad crítica.

## 4. Organización de los registros de QA

La documentación de esta carpeta se organiza por finalidad y trazabilidad.

| Documento / recurso | Contenido |
|---|---|
| `alineacion_E2E.md` | Seguimiento y sincronización de las pruebas de extremo a extremo. |
| `e2e-integration-status.md` | Estado de integración y ejecución de pruebas E2E. |
| `bugs_registros_defectos_seguimiento.md` | Registro y seguimiento de defectos, bloqueos y su evolución. |
| `ISSUE_LEADS_SIN_RESULTADOS.md` | Investigación sobre escaneos que finalizan sin capturar leads. |
| `investigaciones/` | Análisis técnicos, comparativas y evaluaciones realizadas durante el proyecto. |
| `extraer_y_migrar_200_leads.py` | Script independiente de QA para preparar y migrar datos de demostración. |
| `leads_200_reales.json` | Dataset generado para alimentar y verificar componentes del producto. |
| `seed_200_leads.sql` | Script SQL de carga masiva de datos. |
| `Extraer-datos.md` | Registro de la preparación y extracción de datos. |
| Matriz de casos de prueba | Escenarios funcionales, integración, validaciones y pruebas no funcionales. |
| Archivos Cypress | Pruebas automatizadas sobre funcionalidades disponibles durante el desarrollo. |

La lista representa los documentos identificados en el registro de QA y puede ampliarse a medida que se incorporen nuevos archivos y evidencias.

## 5. Pruebas automatizadas con Cypress

Se utilizaron pruebas automatizadas con Cypress para monitorear y verificar funcionalidades disponibles durante el desarrollo.

La configuración compartida contempla:

- URL base local: `http://localhost:3000`.
- Búsqueda de especificaciones en `cypress/e2e/**/*.cy.js`.
- Grabación de video de las ejecuciones.
- Captura automática de pantalla ante fallos.
- Desactivación del archivo de soporte adicional.

Las pruebas iniciales se orientaron a funcionalidades como autenticación, navegación, dashboard y configuración de parámetros de búsqueda.

### Evidencias

Las capturas y videos deben conservarse junto a sus correspondientes ejecuciones y casos de prueba, permitiendo identificar:

- Caso ejecutado.
- Condiciones de ejecución.
- Resultado obtenido.
- Evidencia visual.
- Defectos observados, cuando corresponda.

La grabación de video y las capturas automáticas no sustituyen el registro del resultado ni la documentación del defecto.

**Nota de configuración:** Cypress utiliza normalmente `cypress.config.js` como nombre del archivo de configuración. Si el archivo está guardado con otro nombre, debe indicarse mediante la opción correspondiente al ejecutarlo. Las rutas predeterminadas de evidencias son `cypress/screenshots/` y `cypress/videos/`, dentro del proyecto Cypress.

La automatización realizada durante el desarrollo no debe confundirse con una suite de regresión completa del producto integrado.

## 6. Matriz de casos de prueba

La matriz documenta los escenarios previstos para evaluar los principales módulos y reglas de negocio.

El alcance contempla:

- Búsqueda y extracción de negocios.
- Aplicación de filtros y criterios de reputación.
- Validación de duplicados.
- Análisis y clasificación mediante IA.
- Generación de borradores.
- Enriquecimiento de contactos.
- Dashboard y visualización de indicadores.
- Historial de escaneos.
- Exportación de información.
- Rendimiento y comportamiento responsive.
- Integración entre frontend, backend y base de datos.

Los estados de los casos deben distinguir entre:

- **PASS:** ejecutado y aprobado.
- **FAIL:** ejecutado y con resultado no esperado.
- **BLOCKED:** no pudo ejecutarse por una dependencia o bloqueo.
- **NOT RUN:** todavía no ejecutado.
- **PENDING VALIDATION:** requiere una nueva verificación o evidencia.

Los estados deben actualizarse únicamente cuando exista evidencia suficiente.

## 7. Estado de integración y validación E2E

La integración de los componentes permitió comenzar a evaluar el comportamiento conjunto del sistema.

Sin embargo, el flujo principal de Nueva Búsqueda presenta bloqueos relacionados con la captura de leads desde Google Maps.

El recorrido que requiere validación completa es:

**Búsqueda → Extracción → Enriquecimiento → Análisis IA → Persistencia → Visualización.**

La imposibilidad de completar la captura impide validar el recorrido E2E de manera satisfactoria.

Es importante diferenciar:

- La disponibilidad de datos previamente migrados.
- El funcionamiento individual de módulos que pueden verificarse por separado.
- La capacidad del radar de obtener nuevos leads mediante una búsqueda real.

La presencia de datos en el dashboard o en la base de datos no demuestra por sí misma que el proceso de extracción en vivo funcione correctamente.

## 8. Registro de defectos e investigaciones técnicas

Durante el seguimiento se documentaron incidencias relacionadas con:

- Ordenamiento por relevancia de Google Maps y resultados fuera del rango de rating requerido.
- Inspección de tarjetas y aplicación de filtros.
- Navegación entre el listado y las fichas individuales de negocios.
- Pérdida de referencias al contenedor de resultados.
- Tiempo de respuesta y consumo de recursos en Browserless.
- Extracción de reseñas y comunicación mediante WebSocket.
- Enriquecimiento de datos de contacto.
- Persistencia de los resultados obtenidos.

Los incidentes y su trazabilidad deben consultarse en el registro de defectos y en los informes de investigación correspondientes.

Las incidencias #51, #60 y #61 forman parte de las investigaciones técnicas sobre conexión con Browserless, filtrado y navegación del scraper. Sus estados deben verificarse contra el repositorio y el seguimiento actualizado del equipo antes de considerarlos resueltos.

## 9. Preparación de datos para demostración y pruebas

Se desarrolló el script independiente:

`extraer_y_migrar_200_leads.py`

Su propósito fue preparar un conjunto de datos para alimentar el sistema y facilitar las pruebas de integración, visualización y demostración del producto.

El proceso generó:

- 200 registros de comercios.
- 1.000 reseñas estructuradas.
- Archivos JSON y SQL.
- Datos para evaluar la visualización y el comportamiento de los componentes.
- Registros para simular actualizaciones y reescaneos.

**Distinción importante:** este proceso de preparación de datos no equivale al scraping en vivo del radar. Las reseñas generadas mediante plantillas, los datos inferidos y los datos efectivamente extraídos deben identificarse por separado.

La carga de este dataset tampoco acredita que el scraper integrado pueda capturar nuevos leads.

## 10. Investigación comparativa: script QA y scraper del backend

Se realizó una evaluación técnica comparativa entre:

- `Qa/extraer_y_migrar_200_leads.py`
- `Back/app/services/scraper_service.py`
- Los servicios asociados del backend.

La investigación permitió identificar diferencias de arquitectura, concurrencia, navegación, filtros, extracción de reseñas, enriquecimiento, uso de IA y persistencia.

La evaluación del código del backend se realizó sobre la implementación disponible en ese momento, sin incorporar los archivos modificados que posteriormente fueron enviados a Lourdes para su evaluación técnica.

Por lo tanto, deben diferenciarse tres referencias:

1. **Script QA:** proceso independiente de preparación de datos.
2. **Backend inspeccionado:** implementación del radar evaluada durante la investigación.
3. **Propuestas técnicas:** modificaciones elaboradas para analizar posibles correcciones, pendientes de evaluación e integración.

Las propuestas no deben considerarse correcciones implementadas hasta que el equipo de desarrollo las incorpore y se verifiquen mediante pruebas.

## 11. Criterios para considerar validado el flujo principal

Para acreditar el funcionamiento del radar no alcanza con que el endpoint responda correctamente o que el escaneo termine con estado `completado`.

Se requiere demostrar que:

1. La búsqueda se inicia con los parámetros configurados.
2. El navegador remoto o local se conecta correctamente.
3. Se inspeccionan resultados suficientes de Google Maps.
4. Los criterios de rating y reseñas se aplican correctamente.
5. Los negocios que cumplen los criterios se capturan sin perder información.
6. Los resultados se procesan y enriquecen según las reglas definidas.
7. El análisis de IA recibe datos válidos.
8. Los resultados se guardan correctamente en la base de datos.
9. El frontend refleja los resultados reales del escaneo.
10. Los casos de prueba correspondientes finalizan con evidencia reproducible.

Un escaneo sin resultados debe permitir distinguir entre ausencia de negocios que cumplan los criterios y fallos técnicos de navegación, extracción o procesamiento.

## 12. Estado general de QA

**Situación documentada al 11/11/2026.**

El trabajo de QA comprende seguimiento incremental, pruebas automatizadas iniciales, diseño de casos de prueba, registro de defectos e investigación técnica.

Parte de los componentes puede verificarse de forma independiente, pero el flujo principal de captura de leads continúa bloqueando la validación E2E.

La matriz conserva los escenarios pendientes para su ejecución cuando se resuelvan las dependencias técnicas.

### Conclusión

El objetivo de QA es aportar evidencia sobre la calidad real del producto, no solamente verificar que sus componentes estén desarrollados o conectados.

La validación integral de RepuSense requiere demostrar que el radar puede realizar una búsqueda real, capturar negocios que cumplan los criterios definidos, procesar la información y entregar resultados consistentes al usuario.

Hasta que ese recorrido pueda ejecutarse de manera reproducible, el flujo E2E debe mantenerse como pendiente de validación o bloqueado, según el estado concreto de cada caso.