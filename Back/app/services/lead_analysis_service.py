import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lead import Lead
from app.models.scan import Resena
from app.services.ai_service import analizar_con_ia
from app.services.prompts import CATEGORIAS_VALIDAS


async def reanalizar_lead(
    db: AsyncSession,
    lead: Lead,
) -> dict:

    resultado = await db.execute(
        select(Resena)
        .where(Resena.lead_id == lead.id)
        .order_by(Resena.id.desc())
    )

    resenas = resultado.scalars().all()

    if not resenas:
        return {
            "estado": "sin_resenas",
            "mensaje": "El lead no tiene reseñas guardadas."
        }

    reviews = [
        {
            "texto": resena.texto,
            "estrellas": resena.estrellas,
        }
        for resena in resenas
        if resena.texto
    ]

    if not reviews:
        return {
            "estado": "sin_resenas",
            "mensaje": "No hay textos de reseñas para analizar."
        }

    # Ejecutar Gemini fuera del hilo del event loop.
    analisis = await asyncio.to_thread(
        analizar_con_ia,
        nombre=lead.nombre,
        rubro=lead.rubro,
        ciudad=lead.ciudad,
        reviews=reviews,
    )

    problema = analisis.get("problema")
    confianza = analisis.get("confianzaIA", 0)
    draft = analisis.get("draft") or {}

    # No guardar el correo de contingencia como análisis exitoso.
    if problema not in CATEGORIAS_VALIDAS or confianza <= 0:
        lead.estado_analisis = "fallido"
        await db.commit()

        return {
            "estado": "fallido",
            "mensaje": "Gemini no pudo completar el análisis."
        }

    lead.problema_ia = problema
    lead.confianza_ia = confianza
    lead.draft_asunto = draft.get("asunto")
    lead.draft_cuerpo = draft.get("cuerpo")
    lead.estado_analisis = "completado"
    lead.origen_analisis = analisis.get("origen_analisis", "gemini")

    await db.commit()
    await db.refresh(lead)

    return {
        "estado": "completado",
        "lead_id": lead.id,
        "problema": lead.problema_ia,
        "confianzaIA": float(lead.confianza_ia),
        "draft": {
            "asunto": lead.draft_asunto,
            "cuerpo": lead.draft_cuerpo,
        },
    }