
from fastapi import FastAPI

from app.api.endpoints.leads import router as leads_router
from app.api.endpoints.scraper import router as scraper_router
from app.api.endpoints.scans import router as scans_router
from app.api.endpoints.dashboard import router as dashboard_router

app = FastAPI(
    title="Radar de Reputación en Crisis - API",
    description="Backend para la automatización de prospección comercial y análisis de reseñas.",
    version="1.0.0"
)

app.include_router(leads_router)
app.include_router(scraper_router)
app.include_router(scans_router)
app.include_router(dashboard_router)


@app.get("/")
async def root():
    return {
        "status": "success",
        "message": "Backend de Radar de Reputación en Crisis funcionando correctamente"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
