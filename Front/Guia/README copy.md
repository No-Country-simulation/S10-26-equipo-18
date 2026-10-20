# Radar de Reputación en Crisis

**Simulación Laboral Abierta — NoCountry**  
**Área:** Marketing Digital / Relaciones Públicas (B2B SaaS)  
**Enfoque:** Prospección automatizada

## 1. Descripción del proyecto

Radar de Reputación en Crisis es una propuesta para automatizar la prospección comercial de una agencia de relaciones públicas y marketing digital que ayuda a pequeñas y medianas empresas —como restaurantes, clínicas y servicios locales— a recuperar su reputación en internet y mitigar el impacto de campañas de difamación o períodos de baja calidad de servicio.

Actualmente, un equipo de tres vendedores dedica aproximadamente **30 horas semanales** a buscar manualmente negocios en Google Maps, TripAdvisor y Yelp con calificaciones de entre **1,5 y 3,5 estrellas**. Luego revisa las reseñas para confirmar que el negocio sigue operando y busca datos de contacto en sitios web o redes sociales.

El objetivo es reducir ese trabajo manual y pasar de aproximadamente **40 leads semanales a cientos de contactos calificados** para que el equipo comercial pueda abordarlos de manera ágil y segmentada.

## 2. Necesidad y objetivo

Automatizar la detección de negocios locales con calificaciones bajas, recopilar sus datos básicos de contacto y centralizar la información para facilitar la prospección comercial.

### Objetivos específicos

- Buscar negocios por ciudad y rubro.
- Aplicar filtros por calificación y cantidad de reseñas.
- Recopilar información del negocio y sus reseñas negativas recientes.
- Identificar con IA el principal problema mencionado en las reseñas.
- Enriquecer los registros con datos de contacto disponibles.
- Centralizar los leads en un dashboard interno.
- Permitir filtrar y exportar los resultados.
- Generar un borrador personalizado de correo comercial basado en las quejas detectadas.

## 3. Enfoque de la solución

La solución propuesta consiste en construir un **pipeline de extracción y enriquecimiento de datos** que reciba una ciudad y un rubro como parámetros de entrada. Por ejemplo: `clínicas dentales en Bogotá`.

El pipeline identifica negocios que cumplan reglas configurables, como:

- Calificación inferior a 3,5 estrellas.
- Más de 10 reseñas.

Luego, puede analizar las últimas cinco reseñas negativas mediante un modelo de lenguaje (LLM) para etiquetar el problema principal, por ejemplo:

- Mala atención al cliente.
- Precios elevados.
- Problemas de higiene.
- Demoras en el servicio.

Los resultados se muestran en un dashboard interno para el equipo de ventas, con opciones para filtrar leads, exportarlos a CSV y copiar un borrador de correo personalizado.

## 4. Flujo funcional

1. **Ingreso de parámetros:** ciudad, rubro y filtros de búsqueda.
2. **Extracción de negocios:** recopilación de nombre, calificación, cantidad de reseñas, reseñas negativas recientes, teléfono y sitio web.
3. **Análisis mediante IA:** clasificación del problema principal identificado en las reseñas.
4. **Enriquecimiento de contactos:** búsqueda de correo electrónico en el sitio web del negocio y búsqueda de información profesional en LinkedIn.
5. **Visualización:** presentación de los leads en una tabla dentro del dashboard.
6. **Filtrado y gestión:** filtros por calificación, problema detectado, ciudad y estado del lead.
7. **Acciones comerciales:** exportación a CSV y copia de un borrador de correo.
8. **Generación de contenido con IA:** creación de un asunto y un primer párrafo de correo basados en quejas específicas.

## 5. Funcionalidades previstas

### Motor de extracción

- Recibir ubicación y rubro como parámetros.
- Consultar una plataforma de origen, como Google Maps o TripAdvisor.
- Extraer los datos definidos para cada negocio.
- Aplicar los filtros de calificación y cantidad de reseñas.

### Enriquecimiento con IA

- Analizar las últimas cinco reseñas negativas.
- Clasificar el problema principal detectado.
- Generar un asunto y un primer párrafo de correo comercial personalizado.

### Enriquecimiento de contactos

- Consultar el sitio web del negocio en busca de un correo electrónico.
- Identificar información profesional relacionada con LinkedIn.
- Incorporar los datos de contacto encontrados al registro del lead.

### Dashboard de prospección

- Mostrar los leads en una tabla.
- Permitir filtros por calificación, problema, ciudad y estado.
- Mostrar los datos de contacto disponibles.
- Exportar los resultados a CSV.
- Copiar el borrador de correo personalizado.

## 6. Desafíos técnicos

### 6.1. Recolección eficiente y bloqueos

**Pregunta a resolver:** ¿Cómo estructurar el scraper para recolectar cientos de registros en un período reducido sin sufrir bloqueos?

El documento propone evaluar estrategias como throttling, esperas aleatorias, ejecución headless, Playwright, rotación de User-Agent y caché. También plantea el desafío de operar sin depender de proxies.

### 6.2. Enriquecimiento de datos de contacto

**Pregunta a resolver:** ¿Cómo encontrar correos electrónicos e información de LinkedIn cuando los directorios no publican directamente esos datos?

El enfoque sugerido contempla consultar el sitio web del negocio, buscar datos de contacto y utilizar patrones de validación, como expresiones regulares para detectar correos electrónicos.

### 6.3. Estado y duplicidad de registros

**Pregunta a resolver:** ¿Cómo evitar duplicados cuando una misma búsqueda se ejecuta más de una vez y cómo actualizar la información existente?

El enfoque sugerido es utilizar una clave única —por ejemplo, `place_id` junto con la fuente—, operaciones de actualización o inserción (*upsert*) y una marca temporal de última actualización.

## 7. Modelo de datos: información prevista

El documento no define un esquema de base de datos completo. A partir de los campos funcionales que sí enumera, cada registro de negocio debería contemplar, como mínimo, los siguientes datos cuando estén disponibles:

| Campo | Descripción |
|---|---|
| Nombre del negocio | Nombre identificado en la plataforma de origen |
| Ciudad / ubicación | Ubicación utilizada para la búsqueda |
| Rubro | Categoría comercial del negocio |
| Fuente | Plataforma de la que se obtuvieron los datos |
| Calificación | Puntuación publicada |
| Cantidad de reseñas | Número de reseñas informado |
| Reseñas negativas recientes | Hasta cinco reseñas para analizar |
| Problema detectado | Etiqueta generada mediante IA |
| Teléfono | Número de contacto disponible |
| Sitio web | URL del negocio, si está disponible |
| Correo electrónico | Dirección encontrada durante el enriquecimiento |
| LinkedIn | Información o enlace encontrado, si corresponde |
| Estado del lead | Estado utilizado para organizar la prospección |
| Última actualización | Marca temporal para actualizar registros |

Esta tabla es una organización documental de los datos mencionados en el proyecto; no representa un esquema de base de datos ya implementado.

## 8. Entregables esperados

1. **Motor de extracción funcional:** script, API o pipeline que reciba rubro y ubicación y devuelva negocios que cumplan los filtros desde una plataforma, como Google Maps o TripAdvisor.
2. **Dashboard de prospección:** aplicación web interna básica para lanzar búsquedas, visualizar leads y consultar sus datos de contacto.
3. **Base de datos de prueba:** al menos **200 leads reales** obtenidos durante las pruebas para demostrar el funcionamiento en el Demo Day.
4. **Funcionalidad diferenciadora con IA:** generación automática del asunto y del primer párrafo de un correo comercial a partir de quejas específicas.

## 9. Stack tecnológico sugerido

Las siguientes tecnologías aparecen como opciones en el documento original; no implican que todas deban utilizarse simultáneamente.

| Capa | Tecnologías sugeridas |
|---|---|
| Datos / scraping | Python con BeautifulSoup, Selenium, Playwright o Scrapy; alternativamente, Node.js con Puppeteer o Crawlee |
| Backend | FastAPI (Python) o Express/NestJS (Node.js) |
| Frontend | React, Next.js o Vue |
| Base de datos | PostgreSQL o MongoDB, con índice único para deduplicación |
| Inteligencia artificial (opcional) | OpenAI API, Anthropic o modelos locales mediante Ollama/LangChain |

## 10. Criterios de demostración del MVP

Según los entregables planteados, la demostración debería permitir comprobar que:

- Se puede iniciar una búsqueda indicando rubro y ubicación.
- La extracción devuelve negocios desde una plataforma de origen.
- Se aplican los filtros definidos para calificación y cantidad de reseñas.
- Los leads muestran los datos recopilados y los datos de contacto encontrados.
- La IA etiqueta el problema principal de las reseñas analizadas.
- El dashboard permite filtrar y exportar los resultados.
- Se puede generar un borrador de correo personalizado.
- La base de datos de prueba contiene al menos 200 leads reales.

Estos puntos resumen los entregables y el flujo descritos en el documento; no constituyen evidencia de que las funcionalidades ya estén implementadas.

## 11. Consideraciones

- El documento describe una **solución propuesta**, no confirma que el sistema esté construido o desplegado.
- Las tecnologías enumeradas son alternativas sugeridas.
- La disponibilidad y el uso de datos de plataformas externas deben verificarse antes de implementar la extracción, respetando sus condiciones de servicio, permisos y normativa aplicable.
- El documento original no especifica arquitectura definitiva, endpoints, diseño completo de la base de datos, autenticación, despliegue ni estrategia de pruebas.

## 12. Contexto

**Programa:** Simulación Laboral Abierta — NoCountry  
**Proyecto:** Radar de Reputación en Crisis  
**Área:** Marketing Digital / Relaciones Públicas (B2B SaaS)  
**Propósito:** automatizar y mejorar la prospección comercial mediante extracción de datos, análisis de reseñas e inteligencia artificial.
