from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.lead import Lead
from app.schemas.lead import LeadResponse, LeadEstadoUpdate


router = APIRouter(prefix="/api/leads", tags=["Leads"])


# ==================================================
# GET /api/leads/ - Listar y filtrar negocios
# ==================================================

@router.get("/", response_model=list[LeadResponse])
async def listar_leads(
    ciudad: str | None = Query(default=None, min_length=1),
    rubro: str | None = Query(default=None, min_length=1),
    rating_min: Decimal | None = Query(default=None, ge=0, le=5),
    rating_max: Decimal | None = Query(default=None, ge=0, le=5),
    estado: str | None = Query(
        default=None,
        pattern="^(nuevo|contactado|convertido|perdido)$"
    ),
    db: AsyncSession = Depends(get_db),
):
    # Validar el rango de calificaciones
    if (
        rating_min is not None
        and rating_max is not None
        and rating_min > rating_max
    ):
        raise HTTPException(
            status_code=422,
            detail="rating_min no puede ser mayor que rating_max"
        )

    # Consulta inicial
    consulta = select(Lead)

    # Filtro por ciudad (sin distinguir acentos ni mayúsculas)
    if ciudad is not None:
        consulta = consulta.where(
            func.unaccent(Lead.ciudad).ilike(
                func.unaccent(ciudad.strip())
            )
        )

    # Filtro por rubro (sin distinguir acentos ni mayúsculas)
    if rubro is not None:
        consulta = consulta.where(
            func.unaccent(Lead.rubro).ilike(
                func.unaccent(rubro.strip())
            )
        )

    # Calificación mínima
    if rating_min is not None:
        consulta = consulta.where(Lead.rating >= rating_min)

    # Calificación máxima
    if rating_max is not None:
        consulta = consulta.where(Lead.rating <= rating_max)

    # Estado comercial
    if estado is not None:
        consulta = consulta.where(Lead.estado == estado)

    # Ordenar por fecha de creación
    consulta = consulta.order_by(Lead.creado_en.desc())

    resultado = await db.execute(consulta)

    return resultado.scalars().all()


@router.get("/filtros")
async def obtener_filtros(db: AsyncSession = Depends(get_db)):
    resultado_ciudades = await db.execute(
        select(Lead.ciudad).distinct().order_by(Lead.ciudad)
    )

    resultado_rubros = await db.execute(
        select(Lead.rubro).distinct().order_by(Lead.rubro)
    )

    return {
        "ciudades": resultado_ciudades.scalars().all(),
        "rubros": resultado_rubros.scalars().all()
    }

@router.get("/{lead_id}", response_model=LeadResponse)
async def obtener_lead(
    lead_id: str,
    db: AsyncSession = Depends(get_db)
):
    resultado = await db.execute(
        select(Lead).where(Lead.id == lead_id)
    )

    lead = resultado.scalar_one_or_none()

    if lead is None:
        raise HTTPException(
            status_code=404,
            detail="Lead no encontrado"
        )

    return lead

@router.patch("/{lead_id}", response_model=LeadResponse)
async def actualizar_estado_lead(
    lead_id: str,
    datos: LeadEstadoUpdate,
    db: AsyncSession = Depends(get_db)
):
    resultado = await db.execute(
        select(Lead).where(Lead.id == lead_id)
    )

    lead = resultado.scalar_one_or_none()

    if lead is None:
        raise HTTPException(
            status_code=404,
            detail="Lead no encontrado"
        )

    lead.estado = datos.estado

    await db.commit()
    await db.refresh(lead)

    return lead