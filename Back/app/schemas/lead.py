
from datetime import datetime, date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict


# Esquema general para listar leads
class LeadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    nombre: str
    rubro: str
    ciudad: str
    fuente: str
    rating: Decimal
    num_resenas: int

    telefono: str | None = None
    web: str | None = None
    email: str | None = None
    linkedin: str | None = None

    problema_ia: str | None = None
    confianza_ia: int | None = None
    estado_analisis: str | None = None

    estado: str | None = None
    vendedor_id: str | None = None
    creado_en: datetime | None = None
    ultimo_escaneo: datetime | None = None

    draft_asunto: str | None = None
    draft_cuerpo: str | None = None


# Reseña negativa almacenada en PostgreSQL
class ResenaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    autor: str | None = None
    fecha: date | None = None
    texto: str
    estrellas: int


# Detalle completo de un lead
class LeadDetailResponse(LeadResponse):
    resenas: list[ResenaResponse] = []


# Actualización del estado comercial
class LeadEstadoUpdate(BaseModel):
    estado: Literal["nuevo", "contactado", "convertido", "perdido"]
