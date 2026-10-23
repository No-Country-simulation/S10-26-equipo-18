# [BUG][CRÍTICO] La búsqueda por radar no respeta los filtros de puntuación y cantidad de reseñas

## Descripción

La funcionalidad de búsqueda por radar debe identificar y mostrar resultados que cumplan con los criterios establecidos en los requerimientos del proyecto:

- **Puntuación:** entre 1.5 y 3.5 estrellas.
- **Cantidad de reseñas:** menor o igual a 10.

Se detectó un incumplimiento de estos criterios en la funcionalidad de búsqueda por radar. Es necesario revisar la aplicación de los filtros para garantizar que los resultados presentados correspondan exclusivamente a los valores definidos por los requerimientos.

## Entorno

- **Aplicación:** S10-26-Equipo-18
- **Entorno:** Demo pública en Vercel
- **URL:** https://s10-26-equipo-18.vercel.app
- **Módulo afectado:** Búsqueda por radar
- **Área sugerida:** Frontend

## Requerimientos esperados

1. Incluir únicamente resultados con una puntuación mínima de 1.5 y máxima de 3.5 estrellas, ambos límites incluidos.
2. Incluir únicamente resultados con un máximo de 10 reseñas.
3. Excluir los resultados que no cumplan cualquiera de los criterios establecidos.
4. Aplicar ambos filtros de manera conjunta, sin que el cumplimiento de uno compense el incumplimiento del otro.

## Resultado esperado

Todos los resultados obtenidos por la búsqueda por radar deben cumplir simultáneamente estas condiciones:

- Puntuación mayor o igual a 1.5 y menor o igual a 3.5 estrellas.
- Cantidad de reseñas menor o igual a 10.

## Impacto

El incumplimiento de los filtros afecta la validez de los resultados de la búsqueda por radar y puede mostrar información que no corresponde al objetivo funcional definido para el producto.

## Prioridad sugerida

**Crítica**, sujeta a confirmar que el incumplimiento bloquea el objetivo principal de la funcionalidad y no existe una alternativa operativa.

## Criterios de aceptación

- [ ] Se incluyen resultados con puntuaciones de 1.5 y 3.5 estrellas.
- [ ] Se excluyen resultados con puntuaciones inferiores a 1.5 o superiores a 3.5 estrellas.
- [ ] Se incluyen resultados con 10 reseñas.
- [ ] Se excluyen resultados con más de 10 reseñas.
- [ ] Se verifica que ambos filtros se apliquen simultáneamente.
- [ ] Se ejecutan pruebas de límites y combinaciones de valores.
- [ ] Se comprueba el comportamiento en el entorno desplegado después de la corrección.

## Evidencia

Adjuntar capturas de los resultados que incumplen los criterios y registrar la puntuación y cantidad de reseñas de cada caso observado.