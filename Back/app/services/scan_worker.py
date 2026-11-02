
import asyncio
import logging

from app.services.scraper_service import extraer_negocios_google_maps
from app.services.scan_service import (
    finalizar_escaneo,
    marcar_escaneo_fallido,
)

logger = logging.getLogger(__name__)


async def ejecutar_escaneo(
    escaneo_id: str,
    ciudad: str,
    rubro: str,
    max_resultados: int,
    rating_min: float,
    rating_max: float,
    resenas_min: int,
):
    """Ejecuta scraping y persistencia sin bloquear FastAPI."""

    try:
        # Playwright síncrono se ejecuta en otro hilo.
        leads = await asyncio.to_thread(
            extraer_negocios_google_maps,
            ciudad=ciudad,
            rubro=rubro,
            max_resultados=max_resultados,
            rating_min=rating_min,
            rating_max=rating_max,
            resenas_min=resenas_min,
        )
        logger.info(
            "[Escaneo %s] Negocios extraídos: %s",
            escaneo_id,
            len(leads),
        )

        # La fecha que devuelve actualmente el scraper es
        # la fecha de extracción, no la publicación de la reseña.
        # Evitamos guardarla como una fecha incorrecta.
        for lead in leads:
            for resena in lead.get("reviewsNegativas") or []:
                resena["fecha"] = None

        resultado = await finalizar_escaneo(
            escaneo_id=escaneo_id,
            leads=leads,
        )

        logger.info("Escaneo completado: %s", resultado)

    except Exception:
        logger.exception("Error ejecutando escaneo %s", escaneo_id)

        try:
            await marcar_escaneo_fallido(escaneo_id)
        except Exception:
            logger.exception(
                "No se pudo marcar como fallido el escaneo %s",
                escaneo_id,
            )
