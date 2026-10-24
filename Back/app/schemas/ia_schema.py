from pydantic import BaseModel
from typing import List

class AnalisisRequest(BaseModel):
    nombre_negocio: str
    resenas: List[str]