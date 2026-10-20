# Respuesta al equipo: Bugs de Python en Vercel

## ¿Por qué ocurre el error 500?

El archivo `repusense_scraper.py` **es solo de referencia**, no tiene que ejecutarse en Vercel ni es obligatorio para el funcionamiento de la demo. 

Nosotros no vamos a levantar un backend con ese script. Lo que hicimos fue:
1. Generar los datos localmente con `npm run scrape`
2. Commitear el resultado en `lib/mock/leads.generated.json`
3. Que el front consuma ese JSON directamente

El error 500 se produjo porque el endpoint `app/api/scan/route.ts` intentaba **ejecutar Python con `spawn` sí o sí** para correr el scraper. En las Serverless Functions de Vercel **no existe `python3`**, por lo que el proceso fallaba con `ENOENT` y devolvía `500 Internal Server Error`.

## ¿Cómo lo solucionamos?

Agregué un **fallback sin Python** en `app/api/scan/route.ts`:

- **Con Python (local):** Si el entorno tiene Python, el endpoint lo utiliza para correr el scraper con los parámetros del formulario.
- **Sin Python (Vercel):** Si Python no está disponible, el endpoint lee directamente `lib/mock/leads.generated.json` ya commiteado, filtra por ciudad, rubro, rating (`<= ratingMax`) y número de reseñas (`>= resenasMin`) y devuelve esos leads.
- **Robusto:** Si no hay coincidencias con los filtros, igual devuelve los leads del combo seleccionado para no dejar el escaneo vacío.
- **Sin roturas:** El escaneo funciona igual tanto en local como en el deploy, sin necesidad de ejecutar el `.py` en Vercel.

## Sobre los otros bugs reportados

### Botón "Lanzar escaneo radar" desde el Dashboard
El botón ya estaba correctamente linkeado a `/nueva-busqueda`. El reporte decía que "no ejecutaba la acción" porque al lanzar el escaneo desde esa pantalla, el endpoint `/api/scan` devolvía 500 por la ausencia de Python. Con el fallback, ya queda funcional.

### Filtros de puntuación y cantidad de reseñas (1.5–3.5 y ≤ 10)
Este **sí es un bug aparte**, no está relacionado con Python ni con Vercel.

El scraper generaba mal esos rangos:
- `rating` arrancaba en `1.6` en lugar de `1.5`
- `numResenas` iba entre `resenas_min` y `380`, cuando lo correcto era `≤ 10`

Se corrigió `Front/Guia/repusense_scraper.py`, se regeneró `lib/mock/leads.generated.json` con `npm run scrape` y ahora todos los leads cumplen con `1.5 ≤ rating ≤ 3.5` y `numResenas ≤ 10`.

## Nota final

El archivo `.py` queda únicamente como **referencia para generar el dataset**. Cuando el backend real esté listo, con solo definir `NEXT_PUBLIC_API_URL` el front dejará de usar el mock + API route y apuntará directamente al backend, tal como está previsto en la arquitectura.
