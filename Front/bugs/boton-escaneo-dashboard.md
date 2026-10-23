# [BUG][FUNCIONAL] El botón «Lanzar escaneo radar» no ejecuta la acción desde el Dashboard

## Descripción

En el módulo **Dashboard / Panel de control**, el botón **«Lanzar escaneo radar»** no permite completar la acción esperada de iniciar un escaneo radar.

La funcionalidad no está operativa desde el panel de control, lo que impide al usuario iniciar el proceso de búsqueda desde el acceso previsto en la interfaz.

Se requiere verificar la vinculación del botón con la acción correspondiente, así como la comunicación con el endpoint encargado de ejecutar el escaneo.

## Entorno

- **Aplicación:** S10-26-Equipo-18
- **Entorno:** Demo pública desplegada en Vercel
- **URL:** https://s10-26-equipo-18.vercel.app
- **Módulo:** Dashboard / Panel de control
- **Elemento afectado:** Botón «Lanzar escaneo radar»
- **Tipo:** Bug funcional de interfaz e integración

## Precondiciones

- Acceder a la aplicación en el entorno desplegado.
- Ingresar al módulo Dashboard / Panel de control.

## Pasos para reproducir

1. Abrir la demo pública.
2. Navegar hasta el Dashboard / Panel de control.
3. Localizar el botón «Lanzar escaneo radar».
4. Hacer clic en el botón.
5. Verificar si se inicia el proceso de escaneo y si se informa su estado al usuario.

## Resultado actual

El botón no cumple la acción esperada de iniciar el escaneo radar desde el Dashboard.

## Resultado esperado

Al hacer clic en «Lanzar escaneo radar», la aplicación debe iniciar la solicitud de escaneo, informar al usuario que el proceso comenzó y mostrar el resultado o el estado correspondiente.

Si la operación falla, la interfaz debe comunicar el error de manera clara, sin dejar al usuario sin información.

## Impacto

- El usuario no puede iniciar el escaneo desde el acceso disponible en el Dashboard.
- Se ve afectado el flujo de interacción previsto para la funcionalidad de radar.
- La interfaz no permite completar la operación desde el punto de acceso indicado.

## Criterios de aceptación

- [ ] El botón responde a la interacción del usuario.
- [ ] La acción dispara la solicitud correspondiente al endpoint de escaneo.
- [ ] La interfaz informa el estado de la operación.
- [ ] Si el servidor responde con un error, se muestra un mensaje comprensible.
- [ ] Se verifica el funcionamiento en el entorno desplegado después de la corrección.

## Dependencia relacionada

El escaneo radar presenta un error de ejecución en Vercel (`500 Internal Server Error`) asociado a la ausencia de `python3` en el entorno de ejecución.

Se debe verificar si la falta de respuesta del botón está relacionada con ese bloqueo técnico o si existe, además, un defecto independiente en la implementación de la interfaz.

## Prioridad sugerida

Alta, pendiente de confirmar el impacto en el flujo principal del producto.

## Evidencia

Adjuntar una captura del Dashboard con el botón afectado y, si es posible, un registro de la interacción o de la solicitud de red generada al hacer clic.