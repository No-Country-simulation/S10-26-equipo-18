## Archivos para extraer la informacion real de los 200 leads

### 1. `extraer_y_migrar_200_leads.py`

El script de Python completo.

Incluye el comando:

```bash
python Qa/extraer_y_migrar_200_leads.py --migrar-bd
```

Este comando permite migrar los datos a la base de datos con un solo comando, utilizando el archivo `.env`.

### 2. `seed_200_leads.sql`

El script SQL listo para ejecutar directamente en PostgreSQL (Docker o Render).

Incluye:
- El UPSERT (`ON CONFLICT DO UPDATE`) de los 200 comercios reales.
- Las 1.000 reseñas.
- Los escaneos con fecha.

### 3. `leads_200_reales.json`

El archivo JSON que contiene:
- Los 200 comercios reales.
- Sus 1.000 reseñas.
- Los escaneos correspondientes.