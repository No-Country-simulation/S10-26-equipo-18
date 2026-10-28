from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


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