Estrategia de Ramas

Para mantener el repositorio ordenado y evitar conflictos en nuestro entorno monorepo, hemos migrado de un esquema de ramas sueltas (como front, qa o ramas numeradas) a un GitFlow estructurado.

Árbol de Integración

main ───────────────────── (Producción / Demo, Protegida, Solo vía PR)
  └── dev ──────────────── (Integración, Protegida, Solo vía PR)
       ├── feat/usuario/nombre ─── (Trabajo individual de nuevas funcionalidades)
       ├── release/vX.X ── (Pruebas E2E y estabilización)
       └── fix/usuario/nombre ──── (Hotfixes y resolución de bugs)

Tipos de Ramas y Convenciones

main (Rama Productiva): Código estable listo para producción y para la demostración del MVP. Nadie puede hacer push directo aquí. Todo cambio ingresa mediante un Pull Request (PR) revisado.

dev (Rama de Desarrollo): Entorno principal de integración donde se unifica el trabajo del frontend y el backend. Es el paso previo a producción y también está protegida.

feat/* (Features): Ramas de trabajo para desarrollar un requisito o funcionalidad específica.
    Ejemplo: feat/maub/google-maps-scraper, feat/dashboard-ui.
    Flujo: Nacen de dev y vuelven a dev mediante un PR.

release/* (Estabilización): Ramas dedicadas exclusivamente a realizar pruebas End-to-End (E2E) y pulir detalles finales antes de un lanzamiento.
    Flujo: Nacen de dev y, tras validar las pruebas, se integran a main mediante PR.

fix/* (Hotfixes / Bugs): Ramas para solucionar errores aislados o bugs detectados durante el desarrollo o en producción.
    Ejemplo: fix/maub/exportacion-csv, fix/filtro-estado-lead.
    Flujo: Nacen de dev (o de main si es crítico) y vuelven mediante PR.

Políticas y Protecciones del Repositorio (Criterios de Aceptación)
Para garantizar la calidad del código, el repositorio cuenta con reglas estrictas (Rulesets) a nivel de configuración en GitHub:
    1. Push directo bloqueado: Es imposible subir código directamente a main o a dev desde la terminal.
    2. Revisión obligatoria: Todo PR requiere un mínimo de 1 aprobación (approval) de otro miembro del equipo antes de poder ser mergeado.
    3. Historial inmutable: Los comandos destructivos como el force-push (git push -f) están bloqueados en las ramas principales.

Flujo de Trabajo Diario del Equipo
    1. Actualizás tu entorno local con la última versión:
        git checkout dev
        git pull origin dev
    2. Creás tu rama de trabajo:
        git checkout -b feat/tu-usuario/nombre-funcionalidad
    3. Trabajás en tu rama: Hacés commit y push cuando necesites.
    4. Solicitás el Pull Request (PR): Cuando termines, creás el PR hacia dev.
    5. Revisión: Otro miembro del equipo revisa tu código.
    6. Merge: Una vez aprobado, se hace merge y tu código pasa a integrar dev.

Reglas de Trabajo
Nunca trabajar directo en main: main es solo para despliegues.
Solo se puede hacer merge a main desde dev mediante un Pull Request (PR).
Solo se puede hacer merge a dev desde una rama feat/ o fix/ mediante un PR.
Antes de subir código, ejecutar npm run lint y npm run build para asegurar la calidad.


