# Escaneos completados sin leads: el filtro de rating contra Google Maps

**Proyecto:** Radar de Reputación en Crisis · S10-26 Equipo 18  
**Módulo:** Backend / scraper + formulario de nueva búsqueda  
**Fecha:** 03/11/2026  
**Estado:** Abierto — pendiente de decisión de producto  
**Severidad:** Alta para la demo (el flujo “funciona” pero no devuelve leads)  
**Prioridad:** P2

---

## 1. Resumen

Varios escaneos terminan en estado `completado` con `total = 0`. En los logs se ve que
el scraper **sí encuentra negocios**:

```text
[RepuSense Pipeline] Buscando 'Centros Estéticos' en 'CDMX'...
[Filtros: Rating 1.5★ - 3.5★ | Min. Reseñas >= 18]
Tarjetas detectadas en el listado: 20
```

Pero ninguno pasa el filtro de calificación, así que no se extrae ningún lead y el
escaneo cierra con cero resultados.

**No es un fallo de la IA ni de la API de Gemini.** Cuando no hay leads que pasen el
filtro, `analizar_con_ia` ni siquiera se ejecuta.

---

## 2. Causa raíz

Se combinan tres factores:

### 2.1. Google Maps ordena por relevancia, no por peor calificación

Google Maps no tiene un filtro “ordenar por rating ascendente”. Los primeros
resultados de una búsqueda suelen ser los negocios más populares y mejor
calificados. En categorías comunes y ciudades grandes, los primeros 20 puestos
casi siempre tienen ratings altos.

### 2.2. El scraper solo inspecciona las primeras 20 tarjetas

En `Back/app/services/scraper_service.py`:

- se hacen **3 scrolls** sobre el feed;
- se toman las `div[role="article"]` (≈20 tarjetas);
- por cada tarjeta se parsea rating y cantidad de reseñas;
- si no cumple `rating_min <= rating <= rating_max` y `num_resenas >= resenas_min`,
  se descarta con `continue` **antes** de abrir la ficha.

`max_resultados` **no** significa “cantidad de tarjetas a revisar”. Significa
“cantidad máxima de leads que se extraen **después** de filtrar”. Por eso subirlo
no ayuda si ninguna tarjeta pasa el filtro.

### 2.3. El formulario topa el rating máximo en 3.5★

En `Front/app/(dashboard)/nueva-busqueda/page.tsx` el slider tiene:

```text
min = 1.5
max = 3.5
```

El backend acepta `rating_min`/`rating_max` entre 0 y 5
(`Back/app/api/endpoints/scans.py`), pero la interfaz no deja pedir más de 3.5.
El endpoint mock `Front/app/api/scan/route.ts` también tiene `RATING_MAX = 3.5`.

---

## 3. Evidencia

Se ejecutó la misma búsqueda que hace el scraper (misma URL de Google Maps, mismo
regex de rating) y se imprimieron los ratings de las primeras 20 tarjetas.

### Buenos Aires · Restaurantes

Rango observado: **4.4 a 4.9**

```text
4.9  4.6  4.7  4.8  4.8  4.8  4.6  4.6  4.4  4.4
4.4  4.4  4.4  4.6  4.7  4.5  4.6  4.4  4.6  4.7
```

Con `rating_max = 2.6` (prueba anterior) no califica ninguna.
Con `rating_max = 3.5` tampoco.

### CDMX · Centros Estéticos

Rango observado: **3.9 a 5.0**

```text
4.9  4.8  4.9  4.7  4.7  4.9  4.8  5.0  4.9  4.9
4.5  4.4  3.9  5.0  4.4  3.9  4.9  4.4  5.0  4.7
```

El más bajo es **3.9**; el filtro pedía `≤ 3.5`. Resultado: **0 leads**.

### Conclusión de la evidencia

- El scraping y el parseo de rating/reseñas funcionan.
- El filtro es el que descarta todo.
- El escaneo `completado` con `total = 0` es coherente con los datos, no un error
  de persistencia.

---

## 4. Qué NO es la causa

| Hipótesis | Verificación |
| --- | --- |
| Gemini falla por rate limit | No se llama a Gemini si ningún negocio pasa el filtro. Además, un fallo de Gemini deja el lead guardado con `problema_ia = null`, no elimina el lead. |
| Chromium/Playwright no está instalado | Ya se instaló (`playwright install chromium`) y el navegador lanza correctamente. |
| La persistencia no guarda | Escaneos anteriores con candidatos sí guardaron leads y actualizaron contadores. |
| `GET /v1/models` 404 | Es un cliente externo sondeando `localhost:8000` como si fuera una API compatible con OpenAI. No existe esa ruta en el repo y no participa del escaneo. |
| “Hay demasiadas peticiones a la IA” | Con cero candidatos no hay ninguna petición a la IA. |

---

## 5. Impacto

- En categorías populares y ciudades grandes, el radar devuelve **cero leads** con
  los filtros actuales.
- El flujo de demo “lanzar escaneo → ver leads nuevos” queda vacío.
- El producto promete detectar negocios “en crisis” (rating bajo), pero la fuente
  prioriza los mejores calificados.
- Los escaneos fallidos o vacíos quedan en el historial y pueden confundir a QA.

---

## 6. Cómo reproducir

1. Levantar PostgreSQL, backend (`uvicorn app.main:app --reload`) y frontend.
2. Ir a **Nueva Búsqueda**.
3. Elegir, por ejemplo:
   - Ciudad: `CDMX`
   - Rubro: `Centros Estéticos`
   - Rating máximo: `3.5`
   - Reseñas mínimas: `18`
4. Lanzar el escaneo.
5. En los logs del backend se ve `Tarjetas detectadas en el listado: 20` y ningún
   `-> [CALIFICA]`.
6. El escaneo termina `completado` con `nuevos = 0`, `actualizados = 0`, `total = 0`.

Para verificar la causa, agregar temporalmente un log antes del `continue` del
filtro:

```python
print(
    f"[DESCARTADO] {nombre_preview} | rating={rating} | reseñas={num_resenas}"
)
```

Eso muestra que los ratings reales están por encima de `rating_max`.

---

## 7. Opciones de solución

| Opción | Qué implica | Esfuerzo | Pros | Contras |
| --- | --- | --- | --- | --- |
| **A. Subir el tope del slider** | Permitir 4.0–5.0 en el front y en el mock | Bajo (1–2 h) | Rápido, destraba la demo | Se aleja del pitch de “crisis”; aparecen negocios buenos |
| **B. Scroll profundo / más páginas** | Cargar 100+ tarjetas antes de filtrar | Medio (1–2 días) | Más chance de encontrar ratings bajos | Más lento, más riesgo de anti-bot y de que Google corte |
| **C. Búsquedas por barrio/nicho** | Consultas más específicas (ej. “centros estéticos Roma Norte”) | Bajo (0–1 día) | Sin cambios de scraping | No es determinista; depende del caso |
| **D. Agregador pago** | Outscraper / SerpAPI / Apify como fuente | Medio (2–4 días) | Muchos resultados, filtrable, más estable | Costo y dependencia externa |
| **E. Datos seed para la demo** | Precargar leads de ejemplo | Bajo (2–4 h) | Demo predecible | No demuestra scraping real |
| **F. Redefinir “crisis”** | Aceptar ≤4.0 o ≤4.2 como objetivo | Bajo/Medio (producto + UI) | Más realista para Google Maps | Cambia la narrativa del producto |

### Recomendación

- **Corto plazo (demo):** combinar **B + log de descartados**. Permite diagnosticar
  y aumenta la chance de encontrar ratings bajos sin cambiar el pitch.
- **Si hay que destrabar ya:** **A** con un flag o aviso (“rango ampliado para
  demo”), dejando claro que no todos son leads en crisis.
- **Demo Day:** **E** como respaldo, para no depender de Google en vivo.
- **Mediano plazo:** **D** si el equipo consigue presupuesto; es la opción más
  robusta para producir muchos candidatos y filtrar por rating localmente.

---

## 8. Criterios de aceptación para el fix

- [ ] El scraper registra nombre, rating y reseñas de **todas** las tarjetas
      inspeccionadas, incluidas las descartadas.
- [ ] Con un `rating_max` que tenga al menos un candidato, el lead se extrae y se
      persiste.
- [ ] Si no hay candidatos, el escaneo termina `completado` con `total = 0` y la UI
      muestra un mensaje claro del tipo “0 resultados: ampliá el rango de rating o
      probá otra ciudad/rubro”.
- [ ] `max_resultados` sigue funcionando como tope de leads extraídos, no de
      tarjetas inspeccionadas.
- [ ] No se rompen el historial de escaneos, la persistencia ni el reanálisis.
- [ ] Se documenta el rango de rating recomendado para la demo.

---

## 9. Preguntas abiertas para el equipo

1. ¿El producto debe buscar solo negocios “en crisis” (≤3.0) o también negocios
   “mejorables” (3.0–4.2)?
2. ¿Está permitido subir el tope del slider en la demo, aunque los leads no sean
   crisis severas?
3. ¿Hay presupuesto para un agregador pago o se mantiene Google Maps scraping?
4. ¿Cuánto tiempo de escaneo es aceptable? Un scroll profundo puede pasar de
   segundos a varios minutos.
5. ¿Se prioriza la demo predecible (seed) o la demostración de scraping real?
