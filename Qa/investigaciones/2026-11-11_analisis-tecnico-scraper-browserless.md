# Investigación técnica: Scraper y Browserless

**Fecha:** 11/11/2026
**Área:** QA / Análisis funcional
**Componente:** Backend — `scraper_service.py` y `enrichment_service.py`
**Issues relacionadas:** #51, #60 y #61
**Estado:** Propuestas compartidas con desarrollo — pendientes de evaluación.

## 1. Contexto y objetivo

Durante el seguimiento de las pruebas y del avance del proyecto, se observaron dificultades persistentes en el proceso de búsqueda y extracción de leads mediante Google Maps, ejecutado en el entorno de producción con Render y Browserless.

Ante la falta de avances concluyentes en la resolución de estos problemas, se realizó una investigación complementaria del código existente, con el objetivo de aportar información técnica que pudiera ayudar a identificar las causas y orientar el análisis de posibles correcciones.

## 2. Análisis realizado

Se revisaron los archivos `scraper_service.py` y `enrichment_service.py`, contrastando su comportamiento y lógica con los defectos registrados en las Issues #51, #60 y #61.

Se analizaron, entre otros aspectos:

- La conexión del navegador remoto mediante Browserless.
- La aplicación de filtros antes de abrir las fichas de negocios.
- La navegación de regreso al listado de Google Maps.
- La extracción de reseñas y los tiempos de ejecución.
- El procesamiento de datos complementarios y el enriquecimiento de leads.

## 3. Asistencia de IA y revisión de propuestas

Como apoyo al análisis, se utilizaron herramientas de IA para explorar posibles causas y generar propuestas de modificación sobre los archivos involucrados.

El código generado fue revisado y contrastado con los problemas observados y documentados, con el propósito de identificar si las propuestas podían resultar útiles para el proyecto.

**Importante:** los archivos propuestos fueron generados con asistencia de IA y revisados como parte de esta investigación. No constituyen una implementación aprobada ni una corrección validada.

## 4. Comunicación al equipo de desarrollo

Se compartieron con Lourdes los archivos propuestos y las observaciones obtenidas durante la investigación, para su evaluación técnica y eventual adaptación o implementación.

La decisión sobre los cambios y su incorporación al código corresponde al equipo de desarrollo.

## 5. Estado y seguimiento

- Investigación y análisis: realizados.
- Propuestas de corrección: compartidas con desarrollo.
- Evaluación técnica: pendiente.
- Implementación: pendiente de decisión del equipo de desarrollo.
- Validación funcional y regresión QA: pendientes de una eventual implementación.

## 6. Alcance del aporte de QA

Esta actividad fue una iniciativa complementaria de análisis y seguimiento orientada a contribuir a la calidad del producto, facilitar la identificación de posibles causas y aportar información útil al equipo.

No implicó la toma de decisiones técnicas ni la implementación de cambios en el backend por parte de QA.