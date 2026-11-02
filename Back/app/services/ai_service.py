import os
import json
import time

from google import genai
from google.genai import types

from app.services.prompts import (
    CATEGORIAS_VALIDAS,
    PROMPT_ANALISIS_REPUTACION,
)


def fallback_local(nombre: str) -> dict:
    """Respuesta alternativa cuando Gemini no está disponible."""
    return {
        "problema": "sin_clasificar",
        "confianzaIA": 0,
        "draft": {
            "asunto": f"Propuesta de diagnóstico para {nombre}",
            "cuerpo": (
                f"Hola, equipo de {nombre}. "
                "Nos gustaría conversar sobre oportunidades "
                "para mejorar la experiencia de sus clientes."
            ),
        },
    }


def analizar_con_ia(
    nombre: str,
    rubro: str,
    ciudad: str,
    reviews: list,
) -> dict:
    """Analiza reseñas negativas y genera un borrador comercial."""

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key or not reviews:
        return fallback_local(nombre)

    textos = "\n- ".join(
        review.get("texto", "")
        for review in reviews
        if review.get("texto")
    )

    if not textos.strip():
        return fallback_local(nombre)

    prompt = PROMPT_ANALISIS_REPUTACION.format(
        nombre=nombre,
        rubro=rubro,
        ciudad=ciudad,
        textos_quejas=textos,
        categorias=CATEGORIAS_VALIDAS,
    )

    try:
        client = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(timeout=30000),
        )

        for intento in range(2):
            try:
                response = client.models.generate_content(
                    model=os.getenv("GEMINI_MODEL", "gemini-3.8-flash"),
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                    ),
                )

                resultado = json.loads(response.text)

                draft = resultado.get("draft")

                if (
                    resultado.get("problema") not in CATEGORIAS_VALIDAS
                    or not isinstance(draft, dict)
                    or not isinstance(draft.get("asunto"), str)
                    or not draft["asunto"].strip()
                    or not isinstance(draft.get("cuerpo"), str)
                    or not draft["cuerpo"].strip()
                ):
                    raise ValueError("Respuesta de Gemini inválida")

                confianza = resultado.get("confianzaIA", 0)

                try:
                    confianza = int(confianza)
                except (TypeError, ValueError):
                    confianza = 0

                resultado["confianzaIA"] = max(0, min(100, confianza))

                print(f"[Gemini] Análisis completado para {nombre}")

                return resultado

            except Exception as error:
                mensaje = str(error)

                print(f"[Gemini] Intento {intento + 1}: {mensaje}")

                # Errores que no conviene reintentar
                if "404" in mensaje or "NOT_FOUND" in mensaje:
                    break

                if "401" in mensaje or "403" in mensaje:
                    break

                # Errores temporales
                es_temporal = any(
                    codigo in mensaje
                    for codigo in [
                        "429",
                        "503",
                        "504",
                        "RESOURCE_EXHAUSTED",
                        "UNAVAILABLE",
                        "DEADLINE_EXCEEDED",
                    ]
                )

                if not es_temporal:
                    break

                if intento == 0:
                    print("[Gemini] Error temporal. Reintentando en 5 segundos...")
                    time.sleep(5)

    except Exception as error:
        print(f"[Gemini] Error al inicializar: {error}")

    return fallback_local(nombre)