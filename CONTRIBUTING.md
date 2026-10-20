# 🌿 Estrategia de Ramas — GitFlow

Para mantener el repositorio ordenado y evitar conflictos en nuestro entorno monorepo, migramos de un esquema de ramas sueltas (`front`, `qa`, ramas numeradas) a un **GitFlow estructurado**.

---

## 🌲 Árbol de Integración

```
main ─────────────────────────── (Producción / Demo · Protegida · Solo vía PR)
 └── dev ──────────────────────── (Integración · Protegida · Solo vía PR)
      ├── feat/usuario/nombre ─── Nuevas funcionalidades
      ├── release/vX.X ────────── Pruebas E2E y estabilización
      └── fix/usuario/nombre ──── Hotfixes y resolución de bugs
```

---

## 🏷️ Tipos de Ramas y Convenciones

| Rama | Propósito | Origen → Destino |
|------|-----------|-----------------|
| `main` | Código estable listo para producción / demo MVP | `dev` → `main` (solo PR) |
| `dev` | Integración de frontend y backend | `feat/*` / `fix/*` → `dev` (solo PR) |
| `feat/*` | Desarrollar una funcionalidad específica | `dev` → `dev` |
| `release/*` | Pruebas E2E y pulido final antes del lanzamiento | `dev` → `main` |
| `fix/*` | Solucionar bugs o errores aislados | `dev` / `main` → `dev` |

### Ejemplos de nombres

```
feat/maub/google-maps-scraper
fix/maub/exportacion-csv
release/v1.0
```

---

## 🔒 Políticas de Protección del Repositorio

El repositorio cuenta con **Rulesets** configurados en GitHub para garantizar la calidad del código:

1. **Push directo bloqueado** — Es imposible subir código directamente a `main` o `dev` desde la terminal.
2. **Revisión obligatoria** — Todo PR requiere al menos **1 aprobación** de otro miembro del equipo antes de poder ser mergeado.
3. **Historial inmutable** — El force-push (`git push -f`) está bloqueado en las ramas principales.

---

## 🔄 Flujo de Trabajo Diario

```bash
# 1. Actualizás tu entorno local con la última versión
git checkout dev
git pull origin dev

# 2. Creás tu rama de trabajo
git checkout -b feat/tu-usuario/nombre-funcionalidad

# 3. Trabajás en tu rama — hacés commit y push cuando necesites
git add .
git commit -m "feat: descripción del cambio"
git push origin feat/tu-usuario/nombre-funcionalidad

# 4. Abrís un Pull Request hacia dev en GitHub

# 5. Un compañero revisa y aprueba el PR

# 6. Se hace merge — tu código pasa a integrar dev ✅
```

---

## ✍️ Convención de Commits

Seguimos el estándar **Conventional Commits**. El formato es:

```
<tipo>(<scope opcional>): <descripción corta en imperativo>
```

### Tipos disponibles

| Tipo | Cuándo usarlo | Ejemplo |
|------|--------------|---------|
| `feat` | Nueva funcionalidad | `feat: agregar filtro por estado de lead` |
| `fix` | Corrección de un bug | `fix: corregir exportación de CSV vacío` |
| `docs` | Solo documentación | `docs: actualizar CONTRIBUTING.md` |
| `style` | Formato, espacios, comas (sin lógica) | `style: formatear componente Header` |
| `refactor` | Refactor sin nueva funcionalidad ni bug fix | `refactor: extraer lógica de auth a hook` |
| `test` | Agregar o corregir tests | `test: agregar tests unitarios al servicio de leads` |
| `chore` | Tareas de mantenimiento, dependencias | `chore: actualizar dependencias de npm` |
| `clean` | Eliminar código muerto, logs, comentarios | `clean: eliminar console.logs del módulo de scraper` |
| `build` | Cambios en build system o herramientas externas | `build: configurar vite para producción` |
| `ci` | Cambios en pipelines / GitHub Actions | `ci: agregar workflow de lint automático` |

### Reglas del mensaje

- Usar **imperativo** en la descripción: `agregar`, `corregir`, `eliminar` — no `agregué` ni `agrega`.
- Máximo **72 caracteres** en la primera línea.
- No terminar con punto.

---

## 📋 Reglas de Trabajo

- ❌ **Nunca** trabajar directo en `main` — es solo para despliegues.
- ✅ Solo se puede hacer merge a `main` desde `dev` mediante un **Pull Request**.
- ✅ Solo se puede hacer merge a `dev` desde una rama `feat/*` o `fix/*` mediante un **PR**.
- ✅ Antes de subir código, ejecutar:

```bash
npm run lint
npm run build
```
