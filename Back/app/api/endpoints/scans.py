from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field, model_validator
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.scan import Escaneo
from app.services.scan_service import crear_escaneo
from app.services.scan_worker import ejecutar_escaneo


router = APIRouter(prefix="/api/scans", tags=["Escaneos"])


class ScanRequest(BaseModel):
    ciudad: str = Field(min_length=2, max_length=100)
    rubro: str = Field(min_length=2, max_length=100)
    max_resultados: int = Field(default=2, ge=1, le=5)
    rating_min: float = Field(default=1.5, ge=0, le=5)
    rating_max: float = Field(default=3.5, ge=0, le=5)
    resenas_min: int = Field(default=10, ge=0)

    @model_validator(mode="after")
    def validar_ratings(self):
        if self.rating_min > self.rating_max:
            raise ValueError(
                "rating_min no puede ser mayor que rating_max"
            )
        return self    

def serializar_escaneo(escaneo: Escaneo) -> dict:
    return {
        "id": escaneo.id,
        "ciudad": escaneo.ciudad,
        "rubro": escaneo.rubro,
        "plataformas": escaneo.plataformas,
        "rating_min": (
            float(escaneo.rating_min)
            if escaneo.rating_min is not None else None
        ),
        "rating_max": (
            float(escaneo.rating_max)
            if escaneo.rating_max is not None else None
        ),
        "resenas_min": escaneo.resenas_min,
        "estado": escaneo.estado,
        "fecha": escaneo.fecha,
        "nuevos": escaneo.nuevos,
        "actualizados": escaneo.actualizados,
        "total": escaneo.total,
        "duracion_seg": escaneo.duracion_seg,
    }


@router.post("", status_code=202)
async def iniciar_escaneo(
    request: ScanRequest,
    background_tasks: BackgroundTasks,
):
    escaneo_id = await crear_escaneo(
        ciudad=request.ciudad,
        rubro=request.rubro,
        rating_min=request.rating_min,
        rating_max=request.rating_max,
        resenas_min=request.resenas_min,
    )

    background_tasks.add_task(
        ejecutar_escaneo,
        escaneo_id=escaneo_id,
        ciudad=request.ciudad,
        rubro=request.rubro,
        max_resultados=request.max_resultados,
        rating_min=request.rating_min,
        rating_max=request.rating_max,
        resenas_min=request.resenas_min,
    )

    return {
        "id": escaneo_id,
        "estado": "en_progreso",
        "mensaje": "Escaneo registrado e iniciado",
    }


@router.get("")
async def listar_escaneos():
    async with AsyncSessionLocal() as session:
        resultado = await session.execute(
            select(Escaneo).order_by(Escaneo.fecha.desc()).limit(50)
        )
        escaneos = resultado.scalars().all()

        return [serializar_escaneo(e) for e in escaneos]


@router.get("/{escaneo_id}")
async def obtener_escaneo(escaneo_id: str):
    async with AsyncSessionLocal() as session:
        escaneo = await session.get(Escaneo, escaneo_id)

        if escaneo is None:
            raise HTTPException(
                status_code=404,
                detail="Escaneo no encontrado",
            )

        return serializar_escaneo(escaneo)