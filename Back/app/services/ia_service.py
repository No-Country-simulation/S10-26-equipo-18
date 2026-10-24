import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Inicializar el cliente oficial de Google GenAI usando la API Key del .env
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

async def analizar_resenas_y_redactar_correo(nombre_negocio: str, resenas: list[str]) -> dict:
    """
    Toma el nombre de un negocio y sus reseñas negativas, 
    utiliza Google Gemini para detectar el problema principal y redacta un correo comercial B2B en español.
    """
    texto_resenas = "\n".join([f"- {resena}" for resena in resenas])
    
    prompt = f"""
    Eres un experto en ventas B2B y marketing de reputación online para agencias.
    Analiza las siguientes reseñas negativas del negocio '{nombre_negocio}':

    {texto_resenas}

    Responde ÚNICAMENTE con un objeto JSON válido, sin bloques de código ni texto adicional, que contenga exactamente estas dos claves:
    1. "problema_detectado": Una breve descripción (máximo 10 palabras) del problema principal que afecta al negocio.
    2. "borrador_correo": Un correo electrónico comercial persuasivo, profesional y empático dirigido al dueño del negocio, redactado en español, mencionando sutilmente estos problemas específicos y ofreciendo una solución de gestión de reputación.
    """

    try:
        # Usamos el modelo que nos exige la API y configuración estándar sin forzar mime_type por ahora
        response = client.models.generate_content(
            model='gemini-3.8-flash',
            contents=prompt,
        )
        
        # Limpiar posibles marcas de código markdown si las llega a traer el texto
        texto_limpio = response.text.replace("```json", "").replace("```", "").strip()
        datos_parseados = json.loads(texto_limpio)
        
        return {
            "status": "success",
            "data": datos_parseados
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error al procesar la IA con Gemini: {str(e)}"
        }