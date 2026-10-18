import os
import re
import sys
import json
import time
import random
from pathlib import Path
from datetime import datetime, timezone
from dotenv import load_dotenv

# Cargar variables desde .env en la raíz de 'back'
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from playwright.sync_api import sync_playwright
from google import genai
from google.genai import types

from prompts import CATEGORIAS_VALIDAS, PROMPT_ANALISIS_REPUTACION

# Configurar salida UTF-8 para consolas en Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def micro_pausa(min_s: float = 0.3, max_s: float = 0.6):
    """Pausa mínima para permitir transiciones de interfaz sin frenar el flujo."""
    time.sleep(random.uniform(min_s, max_s))


def _fallback_local(nombre: str) -> dict:
    """Respuesta por defecto para no frenar el scraping si la API de IA no responde o se satura."""
    return {
        "problema": "atencion",
        "confianzaIA": 70,
        "draft": {
            "asunto": f"Diagnóstico de reputación para {nombre}",
            "cuerpo": f"Estimado equipo de {nombre}, analizando las reseñas recientes detectamos fricciones en la experiencia de sus clientes. En RepuSense ayudamos a optimizar estos puntos clave para proteger su reputación digital."
        }
    }


def analizar_con_ia(nombre: str, rubro: str, ciudad: str, reviews: list) -> dict:
    """Envía las quejas a Gemini con timeout estricto y reintentos ante error 503."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("    [Aviso] No se encontró GEMINI_API_KEY en .env.")
        return _fallback_local(nombre)

    if not reviews:
        return {
            "problema": "atencion",
            "confianzaIA": 65,
            "draft": {
                "asunto": f"Diagnóstico de reputación para {nombre}",
                "cuerpo": f"Estimado equipo de {nombre}, detectamos oportunidades de optimización según su calificación promedio..."
            }
        }

    client = genai.Client(api_key=api_key)
    textos = "\n- ".join([r.get("texto", "") for r in reviews if r.get("texto")])

    prompt = PROMPT_ANALISIS_REPUTACION.format(
        nombre=nombre,
        rubro=rubro,
        ciudad=ciudad,
        textos_quejas=textos,
        categorias=CATEGORIAS_VALIDAS
    )

    max_intentos = 2
    demoras_espera = [3, 6]

    for intento in range(max_intentos):
        try:
            # Timeout explícito de 15 segundos para evitar cuelgues indefinidos de red
            res = client.models.generate_content(
                model="gemini-3.8-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    timeout=15.0
                )
            )
            return json.loads(res.text)

        except Exception as e:
            error_str = str(e)
            if "503" in error_str or "UNAVAILABLE" in error_str or "timeout" in error_str.lower():
                wait_time = demoras_espera[intento]
                print(f"    [IA Demorada/Saturada] Reintentando en {wait_time}s (intento {intento + 1}/{max_intentos})...")
                time.sleep(wait_time)
            else:
                print(f"    [Error IA no recuperable]: {e}")
                break

    print("    [Aviso] La API no respondió a tiempo. Usando draft de contingencia.")
    return _fallback_local(nombre)


def extraer_resenas_negativas(page, max_resenas: int = 4) -> list:
    """Navega a opiniones, ordena por las más bajas y extrae quejas únicas (<= 3 estrellas)."""
    reviews = []
    fecha_actual = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    textos_vistos = set()

    try:
        tab_resenas = page.locator('button[role="tab"]:has-text("Opiniones"), button[role="tab"]:has-text("Reseñas")')
        if tab_resenas.count() > 0:
            tab_resenas.first.click()
            micro_pausa(0.5, 0.8)

            # Intentar ordenar por más bajas
            btn_ordenar = page.locator('button[data-value="Ordenar"], button[aria-label*="Ordenar"]')
            if btn_ordenar.count() > 0:
                btn_ordenar.first.click()
                micro_pausa(0.4, 0.6)

                opcion_bajas = page.locator('div[role="menuitemradio"]:has-text("Más bajas")')
                if opcion_bajas.count() > 0:
                    opcion_bajas.first.click()
                    micro_pausa(1.0, 1.5)

            # Expandir reseñas cortadas
            botones_mas = page.locator('button:has-text("Más"), button[aria-label*="ver más"]').all()
            for btn in botones_mas[:max_resenas * 2]:
                try:
                    btn.click(timeout=600)
                except Exception:
                    pass

            # Extraer tarjetas de opiniones
            review_cards = page.locator('div[data-review-id]').all()
            for r_card in review_cards:
                if len(reviews) >= max_resenas:
                    break
                try:
                    texto_el = r_card.locator('span.wiI7pd')
                    if texto_el.count() == 0:
                        continue
                    texto = texto_el.first.inner_text().strip()

                    # Deduplicación por contenido de texto
                    if not texto or texto in textos_vistos:
                        continue

                    # Estrellas de la reseña
                    estrellas = 1
                    star_el = r_card.locator('span.kvMYJc')
                    if star_el.count() > 0:
                        aria_star = star_el.first.get_attribute("aria-label") or ""
                        match_s = re.search(r"(\d+)", aria_star)
                        if match_s:
                            estrellas = int(match_s.group(1))

                    # Filtrar solo reseñas negativas o críticas (1 a 3 estrellas)
                    if estrellas > 3:
                        continue

                    autor_el = r_card.locator('div.d4r55')
                    autor = autor_el.first.inner_text().strip() if autor_el.count() > 0 else "Usuario Anónimo"

                    textos_vistos.add(texto)
                    reviews.append({
                        "autor": autor,
                        "fecha": fecha_actual,
                        "texto": texto,
                        "estrellas": estrellas
                    })
                except Exception:
                    continue
    except Exception as e:
        print(f"    [Aviso reseñas]: {e}")

    return reviews


def extraer_negocios_google_maps(ciudad: str, rubro: str, max_resultados: int = 2,
                                rating_max: float = 3.5, resenas_min: int = 10) -> list:
    """Busca negocios en Google Maps, aplica filtros de crisis y extrae contactos y reseñas."""
    query = f"{rubro} en {ciudad}"
    url = f"https://www.google.com/maps/search/{query.replace(' ', '+')}"
    leads_encontrados = []
    fecha_actual = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    print(f"\n[RepuSense Pipeline] Buscando '{rubro}' en '{ciudad}'...")
    print(f"[Filtros: Rating <= {rating_max}★ | Min. Reseñas >= {resenas_min}]")

    headless_mode = os.environ.get("SCRAPER_HEADLESS", "True").lower() in ("true", "1", "yes")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=headless_mode,
            args=["--disable-blink-features=AutomationControlled"]
        )
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            locale="es-ES"
        )
        page = context.new_page()

        # Descartar imágenes y medios para acelerar la carga de red
        page.route("**/*", lambda route: route.abort() if route.request.resource_type in ["image", "media", "font"] else route.continue_())

        try:
            page.goto(url, wait_until="domcontentloaded", timeout=35000)

            # Rechazar o aceptar cookies si aparece el modal
            try:
                btn_consent = page.locator("button:has-text('Rechazar todo'), button:has-text('Aceptar todo')")
                if btn_consent.count() > 0:
                    btn_consent.first.click(timeout=1200)
            except Exception:
                pass

            # Esperar a que el contenedor de resultados esté disponible
            try:
                page.wait_for_selector('div[role="feed"]', timeout=8000)
            except Exception:
                pass

            feed = page.locator('div[role="feed"]')
            if feed.count() > 0:
                feed.hover()
                for _ in range(3):
                    page.mouse.wheel(0, 3500)
                    micro_pausa(0.4, 0.7)

            cards = page.locator('div[role="article"]').all()
            print(f"Tarjetas detectadas en el listado: {len(cards)}\n")

            idx = 0
            nombres_vistos = set()

            for card in cards:
                if idx >= max_resultados:
                    break

                try:
                    card_text = card.inner_text()

                    # 1. Rating previo
                    rating = 0.0
                    match_r = re.search(r"(\d+[\.,]\d+)\s*(?:★|estrellas)?", card_text)
                    if match_r:
                        rating = float(match_r.group(1).replace(",", "."))

                    # 2. Reseñas previas
                    num_resenas = 0
                    match_res = re.search(r"\((\d[\d\.,]*)\)", card_text)
                    if match_res:
                        num_resenas = int(re.sub(r"[^\d]", "", match_res.group(1)))

                    # Filtro temprano en el feed
                    if not (0 < rating <= rating_max and num_resenas >= resenas_min):
                        continue

                    # Chequeo previo para no hacer clic en locales ya vistos
                    nombre_preview = card_text.split("\n")[0].strip()
                    if nombre_preview.lower() in nombres_vistos:
                        continue

                    # Abrir la ficha del negocio
                    card.click(force=True)
                    page.wait_for_selector("h1.DUwDvf", timeout=5000)
                    micro_pausa(0.4, 0.7)

                    nombre_el = page.locator("h1.DUwDvf")
                    nombre = nombre_el.first.inner_text().strip() if nombre_el.count() > 0 else nombre_preview

                    nombre_key = nombre.lower()
                    if nombre_key in nombres_vistos:
                        continue
                    nombres_vistos.add(nombre_key)

                    print(f"-> [CALIFICA] {nombre} ({rating}★ | {num_resenas} reseñas)")

                    # Web
                    web_el = page.locator('a[data-item-id="authority"]')
                    web = web_el.first.get_attribute("href") if web_el.count() > 0 else None

                    # Teléfono limpio de glifos/íconos
                    tel_el = page.locator('button[data-item-id^="phone:"]')
                    telefono_raw = tel_el.first.inner_text().strip() if tel_el.count() > 0 else None
                    telefono = re.sub(r"[^\d\+\s\-\(\)]", "", telefono_raw).strip() if telefono_raw else None

                    # Extracción de quejas negativas
                    quejas = extraer_resenas_negativas(page, max_resenas=4)
                    if quejas:
                        print(f"   Quejas recolectadas: {len(quejas)}. Analizando con Gemini...")
                    else:
                        print("   [Aviso] No se pudieron extraer textos de quejas, generando draft general...")

                    enriquecimiento = analizar_con_ia(nombre, rubro, ciudad, quejas)

                    lead = {
                        "id": f"lead-{re.sub(r'[^a-z0-9]', '', ciudad.lower())[:3]}-{random.randint(100, 999)}",
                        "nombre": nombre,
                        "rubro": rubro,
                        "ciudad": ciudad,
                        "fuente": "Google Maps",
                        "rating": rating,
                        "numResenas": num_resenas,
                        "telefono": telefono,
                        "web": web,
                        "email": None,
                        "linkedin": None,
                        "problema": enriquecimiento["problema"],
                        "confianzaIA": enriquecimiento["confianzaIA"],
                        "reviewsNegativas": quejas,
                        "draft": enriquecimiento["draft"],
                        "estado": "nuevo",
                        "actualizado": False,
                        "ultimoEscaneo": fecha_actual,
                        "vendedor": None
                    }
                    leads_encontrados.append(lead)
                    idx += 1

                except Exception as e:
                    continue

        finally:
            context.close()
            browser.close()

    return leads_encontrados


if __name__ == "__main__":
    leads = extraer_negocios_google_maps(
        ciudad="Buenos Aires",
        rubro="clinicas",
        max_resultados=2,
        rating_max=3.5,
        resenas_min=10
    )
    print("\n--- OBJETO FINAL LISTO PARA FRONTEND / PERSISTENCIA ---")
    print(json.dumps(leads, indent=2, ensure_ascii=False))