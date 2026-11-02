
import uuid
from datetime import datetime, timezone

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.scan import Escaneo
from app.services.lead_persistence_service import guardar_leads_escaneo


async def crear_escaneo(
    ciudad: str,
    rubro: str,
    rating_min: float,
    rating_max: float,
    resenas_min: int,
) -> str:
    """Registra un escaneo pendiente de ejecución."""

    escaneo_id = str(uuid.uuid4())

    async with AsyncSessionLocal() as session:
        async with session.begin():
            escaneo = Escaneo(
                id=escaneo_id,
                ciudad=ciudad,
                rubro=rubro,
                plataformas=["Google Maps"],
                rating_min=rating_min,
                rating_max=rating_max,
                resenas_min=resenas_min,
                estado="en_progreso",
            )
            session.add(escaneo)

    return escaneo_id


async def finalizar_escaneo(
    escaneo_id: str,
    leads: list[dict],
) -> dict:
    """Guarda los leads y marca el escaneo como completado."""

    async with AsyncSessionLocal() as session:
        async with session.begin():
            resultado = await session.execute(
                select(Escaneo).where(Escaneo.id == escaneo_id)
            )
            escaneo = resultado.scalar_one_or_none()

            if escaneo is None:
                raise ValueError("El escaneo no existe")

            if escaneo.estado != "en_progreso":
                raise ValueError("El escaneo ya fue procesado")

            estadisticas = await guardar_leads_escaneo(
                session=session,
                escaneo_id=escaneo_id,
                leads=leads,
            )

            escaneo.nuevos = estadisticas["nuevos"]
            escaneo.actualizados = estadisticas["actualizados"]
            escaneo.total = estadisticas["total"]
            escaneo.estado = "completado"

            if escaneo.fecha:
                inicio = escaneo.fecha
                if inicio.tzinfo is None:
                    inicio = inicio.replace(tzinfo=timezone.utc)

                escaneo.duracion_seg = max(
                    0,
                    int(
                        (datetime.now(timezone.utc) - inicio)
                        .total_seconds()
                    ),
                )

    return {
        "escaneo_id": escaneo_id,
        "estado": "completado",
        **estadisticas,
    }



async def marcar_escaneo_fallido(escaneo_id: str) -> None:
    """Marca un escaneo como fallido y registra su duración."""

    async with AsyncSessionLocal() as session:
        async with session.begin():
            resultado = await session.execute(
                select(Escaneo).where(Escaneo.id == escaneo_id)
            )
            escaneo = resultado.scalar_one_or_none()

            if escaneo and escaneo.estado == "en_progreso":
                escaneo.estado = "fallido"

                if escaneo.fecha:
                    inicio = escaneo.fecha

                    if inicio.tzinfo is None:
                        inicio = inicio.replace(tzinfo=timezone.utc)

                    escaneo.duracion_seg = max(
                        0,
                        int(
                            (datetime.now(timezone.utc) - inicio)
                            .total_seconds()
                        ),
                    )
