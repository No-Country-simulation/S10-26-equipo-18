
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.endpoints.leads import router as leads_router
from app.api.endpoints.scraper import router as scraper_router
from app.api.endpoints.scans import router as scans_router
from app.api.endpoints.dashboard import router as dashboard_router


app = FastAPI(
    title="Radar de Reputación en Crisis - API",
    description="Backend para la automatización de prospección comercial y análisis de reseñas.",
    version="1.0.0",
)

# Orígenes permitidos para conectar el frontend con FastAPI
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://s10-26-equipo-18.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers del backend
app.include_router(leads_router)
app.include_router(scraper_router)
app.include_router(scans_router)
app.include_router(dashboard_router)


@app.get("/")
async def root():
    return {
        "status": "success",
        "message": "Backend de Radar de Reputación en Crisis funcionando correctamente",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}