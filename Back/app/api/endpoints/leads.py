from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.lead import Lead
from app.schemas.lead import LeadResponse


router = APIRouter(prefix="/api/leads", tags=["Leads"])


@router.get("/", response_model=list[LeadResponse])
async def listar_leads(db: AsyncSession = Depends(get_db)):
    resultado = await db.execute(
        select(Lead).order_by(Lead.creado_en.desc())
    )

    leads = resultado.scalars().all()

    return leads