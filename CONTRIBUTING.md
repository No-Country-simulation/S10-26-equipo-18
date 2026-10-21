# 🌿 Estrategia de Ramas — GitFlow

Para mantener el repositorio ordenado y evitar conflictos en nuestro entorno monorepo, migramos de un esquema de ramas sueltas (`front`, `qa`, ramas numeradas) a un **GitFlow estructurado**.

---

## 🌲 Árbol de Integración

```
main ─────────────────────────── (Producción / Demo · Protegida · Solo vía PR)
 └── dev ──────────────────────── (Integración · Push directo permitido)
      ├── feat/usuario/nombre ─── Nuevas funcionalidades
      ├── release/vX.X ────────── Pruebas E2E y estabilización
      └── fix/usuario/nombre ──── Hotfixes y resolución de bugs
```

---

## 🏷️ Tipos de Ramas y Convenciones

| Rama | Propósito |
|------|-----------|
| `main` | Código estable listo para producción / demo MVP |
| `dev` | Integración de frontend y backend |
| `feat/*` | Desarrollar una funcionalidad específica |
| `release/*` | Pruebas E2E y pulido final antes del lanzamiento |
| `fix/*` | Solucionar bugs o errores aislados |

### Ejemplos de nombres

```
feat/maub/google-maps-scraper
fix/maub/exportacion-csv
release/v1.0
```

---

## 🔒 Políticas de Protección del Repositorio

El repositorio cuenta con **Rulesets** configurados en GitHub:

1. **Push directo bloqueado en `main`** — Solo se puede actualizar `main` mediante un Pull Request aprobado.
2. **Revisión obligatoria en `main`** — Todo PR a `main` requiere al menos **1 aprobación** de otro miembro del equipo.
3. **Historial inmutable en `main`** — El force-push (`git push -f`) está bloqueado.

> `dev` **no tiene protección** — se puede mergear y pushear directamente para agilizar el trabajo diario.

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

# 4. Mergeás tu rama a dev (directo o vía PR, como prefieras)
git checkout dev
git merge feat/tu-usuario/nombre-funcionalidad
git push origin dev

# ✅ Tu código ya está en dev
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
- ✅ Solo se puede hacer merge a `main` desde `dev` mediante un **Pull Request** con al menos 1 aprobación.
- ✅ Para `dev` podés mergear directamente desde tu rama o abrir un PR — a criterio del equipo.
- ✅ Antes de subir código, ejecutar:

```bash
npm run lint
npm run build
```

---

## 🐳 Levantar con Docker

Si no querés instalar Node localmente, podés levantar el frontend con Docker.

**Requisitos:** tener [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo.

### Primera vez

```bash
# Desde la raíz del repo
docker compose up --build
```

Esto construye la imagen y levanta el frontend en `http://localhost:3000`.

### Uso diario

```bash
docker compose up        # levanta el contenedor (usa imagen cacheada)
docker compose down      # baja el contenedor
docker compose up --build  # rebuild completo (si cambiaron dependencias)
```

### Variables de entorno

Copiá el archivo de ejemplo y completá los valores que necesites:

```bash
cp Front/.env.local.example Front/.env.local
```

Docker Compose lo levanta automáticamente si existe. Si no existe, la app corre igual usando datos mock.
