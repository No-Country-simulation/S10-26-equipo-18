"""
Definición de categorías, constantes y plantillas de prompts para la IA de RepuSense.
"""

CATEGORIAS_VALIDAS = [
    "atencion",
    "precios",
    "higiene",
    "demoras",
    "calidad",
    "citas",
]

PROMPT_ANALISIS_REPUTACION = """
Eres un analista de reputación comercial de RepuSense.
Analiza las siguientes reseñas negativas recientes del negocio '{nombre}' (rubro: {rubro}, ciudad: {ciudad}):

Reseñas:
- {textos_quejas}

Tareas:
1. Clasifica el problema principal eligiendo EXACTAMENTE una de estas opciones: {categorias}.
2. Asigna un porcentaje de confianza (entero entre 50 y 99).
3. Redacta un asunto de correo en frío profesional y llamativo.
4. Redacta un cuerpo breve de correo en frío (máximo 2 párrafos) citando de forma constructiva el problema detectado y ofreciendo una breve llamada de diagnóstico sin costo.

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