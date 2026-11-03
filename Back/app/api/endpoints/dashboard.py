
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.lead import Lead

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

PROBLEMAS = [
    "atencion", "precios", "higiene",
    "demoras", "calidad", "citas"
]


@router.get("")
async def obtener_dashboard(
    db: AsyncSession = Depends(get_db),
):
    resultado = await db.execute(select(Lead))
    leads = resultado.scalars().all()

    total = len(leads)

    nuevos = sum(
        1 for lead in leads
        if lead.estado == "nuevo"
    )

    criticos = sum(
        1 for lead in leads
        if lead.rating is not None and float(lead.rating) <= 2.0
    )

    riesgo = sum(
        1 for lead in leads
        if lead.rating is not None
        and 2.0 < float(lead.rating) <= 3.0
    )

    vigilancia = sum(
        1 for lead in leads
        if lead.rating is not None
        and float(lead.rating) > 3.0
    )

    con_email = sum(1 for lead in leads if lead.email)
    con_telefono = sum(1 for lead in leads if lead.telefono)
    con_web = sum(1 for lead in leads if lead.web)

    contactos_totales = sum(
        1 for lead in leads
        if lead.estado in ("contactado", "convertido")
    )

    tasa_abordaje = (
        round(contactos_totales / total * 100, 2)
        if total > 0 else 0
    )

    por_problema = [
        {
            "problema": problema,
            "cantidad": sum(
                1 for lead in leads
                if lead.problema_ia == problema
            ),
        }
        for problema in PROBLEMAS
    ]

    ciudades = sorted({
        lead.ciudad for lead in leads if lead.ciudad
    })

    por_ciudad = [
        {
            "ciudad": ciudad,
            "cantidad": sum(
                1 for lead in leads if lead.ciudad == ciudad
            ),
        }
        for ciudad in ciudades
    ]

    rubros = sorted({
        lead.rubro for lead in leads if lead.rubro
    })

    por_rubro = [
        {
            "rubro": rubro,
            "cantidad": sum(
                1 for lead in leads if lead.rubro == rubro
            ),
        }
        for rubro in rubros
    ]

    por_severidad = [
        {"severidad": "critica", "cantidad": criticos},
        {"severidad": "riesgo", "cantidad": riesgo},
        {"severidad": "vigilancia", "cantidad": vigilancia},
    ]

    return {
        "totalLeads": total,
        "nuevos": nuevos,
        "criticos": criticos,
        "riesgo": riesgo,
        "vigilancia": vigilancia,
        "conEmail": con_email,
        "conTelefono": con_telefono,
        "conWeb": con_web,
        "contactosTotales": contactos_totales,
        "tasaAbordaje": tasa_abordaje,
        "porProblema": por_problema,
        "porCiudad": por_ciudad,
        "porRubro": por_rubro,
        "porSeveridad": por_severidad,
    }
