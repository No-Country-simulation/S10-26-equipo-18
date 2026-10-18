import os
import json
from google import genai
from google.genai import types

CATEGORIAS_VALIDAS = ["atencion", "precios", "higiene", "demoras", "calidad", "citas"]

def analizar_quejas_con_ia(nombre_negocio: str, rubro: str, ciudad: str, reviews: list) -> dict:
    """
    Envía las quejas reales a un LLM para clasificar el dolor principal
    y redactar un cold email personalizado.
    """
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

    # Unir textos de las quejas
    textos_quejas = "\n- ".join([r.get("texto", "") for r in reviews if r.get("texto")])
    
    prompt = f"""
    Eres un analista de reputación comercial de RepuSense.
    
    Analiza las siguientes reseñas negativas recientes del negocio '{nombre_negocio}' (rubro: {rubro}, ciudad: {ciudad}):
    
    Reseñas:
    - {textos_quejas}
    
    Tareas:
    1. Clasifica el problema principal eligiendo EXACTAMENTE una de estas opciones: {CATEGORIAS_VALIDAS}.
    2. Asigna un porcentaje de confianza (entero entre 50 y 99).
    3. Redacta un asunto de correo en frío profesional y llamativo.
    4. Redacta un cuerpo breve de correo en frío (máximo 2 párrafos) citando sutilmente el problema detectado y ofreciendo una reunión diagnóstica sin costo.
    
    Responde ÚNICAMENTE con un objeto JSON válido con este formato:
    {{
      "problema": "categoria_elegida",
      "confianzaIA": 85,
      "draft": {{
        "asunto": "...",
        "cuerpo": "..."
      }}
    }}
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error procesando con IA: {e}")
        # Fallback defensivo
        return {
            "problema": "atencion",
            "confianzaIA": 70,
            "draft": {
                "asunto": f"Propuesta de reputación para {nombre_negocio}",
                "cuerpo": f"Hola equipo de {nombre_negocio}, detectamos oportunidades de mejora en la atención según opiniones recientes..."
            }
        }