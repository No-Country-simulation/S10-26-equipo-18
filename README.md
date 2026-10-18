# RepuSense - Módulo de Scraping y Enriquecimiento con IA

Pipeline automatizado para extraer comercios locales en situación de crisis reputacional desde Google Maps, filtrar reseñas negativas reales y enriquecer cada oportunidad con análisis semántico y borradores personalizados de correo en frío utilizando Google Gemini.

---

## 1. Requisitos Previos

* Python 3.10 o superior
* Acceso a internet para navegación con Playwright y consultas de API
* Clave de API de Google Gemini (obtenible sin costo en [Google AI Studio](https://aistudio.google.com/))

---

## 2. Instalación y Configuración del Entorno

Desde una terminal situada en el directorio `back/`:

### Paso 1: Crear el entorno virtual
```bash
python -m venv venv
```

### Paso 2: Activar el entorno virtual
* En Windows (PowerShell):
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
* En Windows (Símbolo del sistema / CMD):
  ```cmd
  .\venv\Scripts\activate.bat
  ```
* En macOS / Linux:
  ```bash
  source venv/bin/activate
  ```

### Paso 3: Instalar dependencias
```bash
pip install -r requirements.txt
```

### Paso 4: Instalar binarios de navegador de Playwright
*(Obligatorio solo en la primera instalación en cada máquina)*:
```bash
playwright install chromium
```

---

## 3. Variables de Entorno

Crear el archivo `.env` a partir de la plantilla:

```bash
cp .env.example .env
```

Configurar los siguientes parámetros dentro de `back/.env`:

```env
GEMINI_API_KEY=tu_api_key_aqui
```

* `SCRAPER_HEADLESS=True`: el navegador corre en segundo plano en memoria, optimizando recursos y tiempos.
* `SCRAPER_HEADLESS=False`: abre una ventana interactiva de Chromium para validar visualmente la navegación y los clics.

---

## 4. Ejecución del Pipeline

Para ejecutar una prueba de extracción con los parámetros configurados:

```bash
python src/scraper.py
```

---

## 5. Criterios de Negocio y Lógica del Pipeline

1. **Filtro de crisis temprano:**  
   Descarta directamente en el listado a los locales con calificaciones superiores a $3.5$★ o con menos de $10$ opiniones registradas, evitando peticiones y cargas de DOM innecesarias.

2. **Navegación reactiva y ordenamiento:**  
   Ingresa a la ficha de cada local calificado, abre la sección de reseñas y ordena por *"Más bajas"*, aplicando deduplicación en memoria para no repetir negocios ni opiniones.

3. **Filtro estricto de quejas:**  
   Solo extrae comentarios auténticos con calificaciones de $1$, $2$ o $3$ estrellas.

4. **Clasificación semántica con Gemini:**  
   Analiza el contenido de las quejas y asigna una categoría válida (`atencion`, `precios`, `higiene`, `demoras`, `calidad`, `citas`), calculando el porcentaje de confianza y redactando un borrador de correo personalizado.

5. **Salida compatible:**  
   Estructura la información directamente bajo el contrato de datos requerido por las interfaces de TypeScript del Frontend.