# [BUG] Error 500 al lanzar escaneo radar en Vercel por dependencia de Python no disponible

## Descripción

Al ejecutar la funcionalidad **Lanzar escaneo radar** en la demo pública desplegada en Vercel, la solicitud falla con un error `500 Internal Server Error`.

Durante la investigación se identificó que el endpoint `route.ts` intenta ejecutar el comando `python3` desde una función de servidor de Next.js. En el entorno de despliegue de Vercel, Python no está disponible en el runtime utilizado por la función, por lo que la ejecución falla.

El problema está relacionado con una dependencia del entorno de ejecución no contemplada en el despliegue y no con la configuración local de la computadora de quien realiza la prueba.

## Entorno

- **Aplicación:** S10-26-Equipo-18
- **Entorno:** Demo pública / producción en Vercel
- **URL:** https://s10-26-equipo-18.vercel.app
- **Componente afectado:** Endpoint `route.ts`
- **Funcionalidad:** Lanzar escaneo radar
- **Resultado observado:** `500 Internal Server Error`

## Pasos para reproducir

1. Acceder a la demo pública: https://s10-26-equipo-18.vercel.app.
2. Navegar hasta la funcionalidad de escaneo radar.
3. Ejecutar la acción **Lanzar escaneo radar**.
4. Observar la respuesta de la solicitud.

## Resultado actual

La operación falla y devuelve un error `500 Internal Server Error`.

En los registros de ejecución se identifica que el servidor no encuentra el ejecutable `python3`, requerido por el endpoint `route.ts`.

## Resultado esperado

La funcionalidad de escaneo radar debería ejecutarse correctamente en el entorno desplegado, sin errores derivados de dependencias de ejecución ausentes.

Si el procesamiento requiere Python, el despliegue debe contemplar un entorno compatible o utilizar una estrategia de ejecución compatible con la arquitectura de Vercel.

## Impacto

- La funcionalidad de escaneo radar no puede completarse en la demo pública.
- Los usuarios no pueden obtener el resultado esperado de esta operación.
- La funcionalidad queda degradada en el entorno desplegado, aunque pueda funcionar en un entorno local que disponga de Python.

## Hipótesis técnica

El endpoint `route.ts` intenta ejecutar `python3` desde una función Serverless de Next.js en Vercel, donde ese ejecutable no está disponible en el runtime actual.

Se requiere revisar la estrategia de ejecución del proceso Python y su compatibilidad con el entorno de despliegue.

## Evidencia

- Mensaje observado: `No se encontró Python ("python3")`.
- Respuesta del servidor: `500 Internal Server Error`.
- Entorno de reproducción: demo pública desplegada en Vercel.

**Nota:** Adjuntar captura del error y, si está disponible, el registro de ejecución de la función en Vercel.

## Criterios de aceptación

- [ ] La acción **Lanzar escaneo radar** se ejecuta correctamente en la demo pública.
- [ ] El endpoint procesa la solicitud sin errores por ausencia de dependencias.
- [ ] La operación devuelve una respuesta válida cuando el procesamiento finaliza correctamente.
- [ ] Los errores de ejecución se gestionan y comunican adecuadamente, sin provocar fallos inesperados.
- [ ] Se verifica nuevamente la funcionalidad después del nuevo despliegue.

## Área sugerida

Frontend / Backend / Configuración de despliegue

**Prioridad sugerida:** Alta si el escaneo radar es una funcionalidad central de la demo; confirmar según el alcance del producto.