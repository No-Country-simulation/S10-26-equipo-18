import os
import json
import time
import random

from google import genai
from google.genai import types

from app.services.prompts import (
    CATEGORIAS_VALIDAS,
    PROMPT_ANALISIS_REPUTACION,
)


# --- LÓGICA DE ROTACIÓN DE IA ---
# Alternar entre Gemini y OpenAI para evitar congelamientos por uso gratuito

_ia_state = {
    "providers": {
        "gemini": {
            "key": os.getenv("GEMINI_API_KEY"),
            "model": os.getenv("GEMINI_MODEL", "gemini-3.5-flash"),
            "last_used": 0,
            "type": "gemini",
        },
        "openai": {
            "key": os.getenv("OPENAI_API_KEY"),
            "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            "last_used": 0,
            "type": "openai",
        },
    },
    "sequence": ["gemini", "openai"],
    "index": 0,
}


def _obtener_clave_ia() -> tuple[str, str]:
    """Retorna (tipo_ia, api_key) basándose en la secuencia de rotación.
    
    Alterna entre Gemini y OpenAI en cada llamado.
    """
    # Usar secuencias aleatorias para distribuir el uso
    provider_name = _ia_state["sequence"][_ia_state["index"] % len(_ia_state["sequence"])]
    _ia_state["index"] += 1
    provider = _ia_state["providers"][provider_name]
    return provider["type"], provider["key"]


def _usar_gemini(nombre: str, rubro: str, ciudad: str, reviews: list) -> dict:
    """Analiza usando Gemini (con rotación automática)."""
    ia_type, api_key = _obtener_clave_ia()

    if not api_key or not reviews:
        return _fallback_local(nombre)

    textos = "\n- ".join(
        review.get("texto", "")
        for review in reviews
        if review.get("texto")
    )

    if not textos.strip():
        return _fallback_local(nombre)

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
                    model=os.getenv("GEMINI_MODEL", "gemini-3.5-flash"),
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

                resultado["origen_analisis"] = "gemini"

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

    return _fallback_local(nombre)


def _usar_openai(nombre: str, rubro: str, ciudad: str, reviews: list) -> dict:
    """Analiza usando OpenAI (gpt-4o-mini) como alternativa a Gemini."""
    import openai

    ia_type, api_key = _obtener_clave_ia()

    if not api_key or not reviews:
        return _fallback_local(nombre)

    textos = "\n- ".join(
        review.get("texto", "")
        for review in reviews
        if review.get("texto")
    )

    if not textos.strip():
        return _fallback_local(nombre)

    prompt = PROMPT_ANALISIS_REPUTACION.format(
        nombre=nombre,
        rubro=rubro,
        ciudad=ciudad,
        textos_quejas=textos,
        categorias=CATEGORIAS_VALIDAS,
    )

    try:
        client = openai.OpenAI(api_key=api_key)

        for intento in range(3):
            # Saber qué modelo usar según el tipo de IA
            model = (
                os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
                if ia_type == "gemini"
                else os.getenv("OPENAI_MODEL", "gpt-4o-mini")
            )

            try:
                response = client.chat.completions.create(
                    model=model,
                    messages=[
                        {
                            "role": "system",
                            "content": "Eres un analista experto en reputación de negocios. Debes analizar las reseñas negativas y devolver un JSON con: problema (una de: atencion, precios, higiene, demoras, calidad, citas), confianzaIA (0-100) y draft con asunto y cuerpo para un contacto comercial.",
                        },
                        {
                            "role": "user",
                            "content": prompt,
                        }
                    ],
                    temperature=0.3,
                    response_format={"type": "json_object"},
                    timeout=30,
                )

                resultado = json.loads(response.choices[0].message.content)

                draft = resultado.get("draft")

                if (
                    resultado.get("problema") not in CATEGORIAS_VALIDAS
                    or not isinstance(draft, dict)
                    or not isinstance(draft.get("asunto"), str)
                    or not draft["asunto"].strip()
                    or not isinstance(draft.get("cuerpo"), str)
                    or not draft["cuerpo"].strip()
                ):
                    raise ValueError("Respuesta de OpenAI inválida")

                confianza = resultado.get("confianzaIA", 0)

                try:
                    confianza = int(confianza)
                except (TypeError, ValueError):
                    confianza = 0

                resultado["confianzaIA"] = max(0, min(100, confianza))

                print(f"[OpenAI] Análisis completado para {nombre}")

                resultado["origen_analisis"] = "openai"

                return resultado

            except Exception as error:
                mensaje = str(error)
                print(f"[OpenAI] Intento {intento + 1}: {mensaje}")

                # Errores temporales
                es_temporal = any(
                    codigo in mensaje
                    for codigo in ["429", "503", "504", "502", "ECONNREFUSED"]
                )

                if not es_temporal:
                    break

                if intento < 2:
                    print(f"[OpenAI] Error temporal. Reintentando en 3 segundos...")
                    time.sleep(3)

    except Exception as error:
        print(f"[OpenAI] Error al inicializar: {error}")

    return _fallback_local(nombre)


def fallback_local(nombre: str) -> dict:
    """Respuesta alternativa cuando ninguna IA está disponible."""
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
        "origen_analisis": "fallback",
    }


def analizar_con_ia(
    nombre: str,
    rubro: str,
    ciudad: str,
    reviews: list,
) -> dict:
    """Analiza reseñas negativas y genera un borrador comercial.
    
    Usa rotación automática entre Gemini y OpenAI.
    Intenta Gemini primero, si falla por errores no temporales o agotamiento,
    cambia automáticamente a OpenAI y viceversa.
    """
    # Determinar qué IA usar basado en el estado de rotación
    ia_type, api_key = _obtener_clave_ia()

    # Si la clave no está configurada, usar fallback
    if not api_key:
        return _fallback_local(nombre)

    # Si no hay reviews, usar fallback
    if not reviews:
        return _fallback_local(nombre)

    # Intentar con la IA correspondiente
    if ia_type == "gemini":
        resultado = _usar_gemini(nombre, rubro, ciudad, reviews)
        # Si Gemini falló y returned fallback, intentar con OpenAI
        if resultado.get("problema") == "sin_clasificar" and resultado.get("confianzaIA") == 0:
            print(f"[IA] Gemini no pudo analizar {nombre}, cambiando a OpenAI")
            return _usar_openai(nombre, rubro, ciudad, reviews)
        return resultado

    elif ia_type == "openai":
        resultado = _usar_openai(nombre, rubro, ciudad, reviews)
        # Si OpenAI falló, intentar con Gemini
        if resultado.get("problema") == "sin_clasificar" and resultado.get("confianzaIA") == 0:
            print(f"[IA] OpenAI no pudo analizar {nombre}, cambiando a Gemini")
            return _usar_gemini(nombre, rubro, ciudad, reviews)
        return resultado

    # Default: intentar Gemini
    return _usar_gemini(nombre, rubro, ciudad, reviews)