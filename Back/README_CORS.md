# CORS habilitado para el frontend

Se agregó `CORSMiddleware` en `Back/app/main.py` para permitir las peticiones desde el frontend.

**Orígenes permitidos:**
- `http://localhost:3000`
- `http://localhost:3001`
- `https://s10-26-equipo-18.vercel.app`

**Configuración:**
- `allow_credentials: True`
- `allow_methods: ["*"]`
- `allow_headers: ["*"]`
