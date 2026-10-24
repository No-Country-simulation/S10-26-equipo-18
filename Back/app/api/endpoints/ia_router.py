from fastapi import APIRouter, HTTPException
from app.schemas.ia_schema import AnalisisRequest
from app.services.ia_service import analizar_resenas_y_redactar_correo

router = APIRouter(prefix="/ia", tags=["Inteligencia Artificial"])

@router.post("/analizar-resenas")
async def analizar_resenas(payload: AnalisisRequest):
    """
    Recibe el nombre de un negocio y una lista de reseñas negativas,
    y retorna el problema principal detectado junto con un correo B2B redactado.
    """
    resultado = await analizar_resenas_y_redactar_correo(payload.nombre_negocio, payload.resenas)
    
    if resultado["status"] == "error":
        raise HTTPException(status_code=500, detail=resultado["message"])
        
    return resultado