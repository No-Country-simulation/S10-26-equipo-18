from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.scraper_service import extraer_negocios_google_maps


router = APIRouter(
    prefix="/api/scraper",
    tags=["Scraper"]
)


class ScraperRequest(BaseModel):
    ciudad: str = Field(min_length=2, max_length=100)
    rubro: str = Field(min_length=2, max_length=100)
    max_resultados: int = Field(default=2, ge=1, le=10)
    rating_min: float = Field(default=1.5, ge=1, le=5)
    rating_max: float = Field(default=3.5, ge=1, le=5)
    resenas_min: int = Field(default=10, ge=0)


@router.post("/test")
def probar_scraper(request: ScraperRequest):
    """
    Ejecuta una búsqueda de prueba en Google Maps.
    No guarda los resultados en PostgreSQL.
    """

    if request.rating_min > request.rating_max:
        raise HTTPException(
            status_code=422,
            detail="rating_min no puede ser mayor que rating_max"
        )

    try:
        leads = extraer_negocios_google_maps(
            ciudad=request.ciudad,
            rubro=request.rubro,
            max_resultados=request.max_resultados,
            rating_min=request.rating_min,
            rating_max=request.rating_max,
            resenas_min=request.resenas_min
        )

        return {
            "status": "success",
            "total": len(leads),
            "leads": leads
        }

    except Exception as error:
        print(f"[Scraper] Error: {error}")

        raise HTTPException(
            status_code=500,
            detail="Ocurrió un error al ejecutar el scraper"
        )
