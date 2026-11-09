import concurrent.futures
import json
import os
import random
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote

from dotenv import load_dotenv
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright

from app.services.ai_service import analizar_con_ia, fallback_local
from app.services.enrichment_service import extraer_contacto_web

# Cargar las variables de entorno desde la raíz del proyecto.
env_path = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(dotenv_path=env_path)

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
def micro_pausa(min_s: float = 0.3, max_s: float = 0.6) -> None:
    """Pausa breve para permitir actualizaciones de la interfaz."""
    time.sleep(random.uniform(min_s, max_s))
def esperar_ficha_negocio(page, nombre_esperado, timeout_ms=12000):
    """
    Espera a que Google Maps abra la ficha del negocio
    seleccionado y verifica que el nombre coincida.
    """
    nombre_esperado = " ".join(nombre_esperado.casefold().split())
    limite = time.monotonic() + timeout_ms / 1000
    while time.monotonic() < limite:
        try:
            titulo = page.locator("h1.DUwDvf").first
            if titulo.count() > 0 and titulo.is_visible():
                nombre_actual = " ".join(
                    titulo.inner_text(timeout=1000).casefold().split()
                )
                if nombre_actual == nombre_esperado:
                    return True
        except Exception:
            pass
        page.wait_for_timeout(400)
    return False
def abrir_ficha_con_reintento(
    page,
    nombre_esperado,
    max_intentos=2
):
    """
    Intenta abrir la ficha de un negocio en Google Maps.
    Si la ficha no se abre correctamente, realiza
    un segundo intento antes de descartarla.
    """
    for intento in range(1, max_intentos + 1):
        try:
            print(
                f"[Ficha] Abriendo '{nombre_esperado}' "
                f"(intento {intento}/{max_intentos})"
            )
            # Volver a localizar la tarjeta por nombre.
            # Evita reutilizar un elemento que Maps haya reemplazado.
            tarjetas = page.locator(
                'div[role="feed"] div[role="article"]'
            )
            tarjeta_actual = None
            for i in range(tarjetas.count()):
                candidata = tarjetas.nth(i)
                texto = candidata.inner_text(timeout=2000)
                nombre = texto.split("\n")[0].strip()
                if nombre.casefold() == nombre_esperado.casefold():
                    tarjeta_actual = candidata
                    break
            if tarjeta_actual is None:
                print(
                    f"[Ficha] No se encontró nuevamente "
                    f"'{nombre_esperado}' en el listado."
                )
                return False
            tarjeta_actual.click(timeout=5000)
            if esperar_ficha_negocio(
                page,
                nombre_esperado,
                timeout_ms=10000
            ):
                print(
                    f"[Ficha] Abierta correctamente: "
                    f"{nombre_esperado}"
                )
                return True
            print(
                f"[Ficha] No se confirmó la apertura "
                f"en el intento {intento}."
            )
        except Exception as exc:
            print(
                f"[Ficha] Error en intento {intento}: {exc}"
            )
        if intento < max_intentos:
            page.wait_for_timeout(1200)
    return False
def obtener_datos_panel_negocio(page):
    """
    Obtiene el rating y la cantidad de reseñas
    desde la ficha abierta de Google Maps.
    """
    rating = None
    num_resenas = None
    try:
        rating_locator = page.locator(
            "div.F7nice span[aria-hidden='true']"
        ).first
        if rating_locator.count() > 0:
            texto_rating = rating_locator.inner_text().strip()
            match = re.search(r"\d+[.,]\d+", texto_rating)
            if match:
                rating = float(
                    match.group(0).replace(",", ".")
                )
        resenas_locator = page.locator(
            "div.F7nice span[aria-label]"
        )
        for i in range(resenas_locator.count()):
            aria_label = (
                resenas_locator.nth(i).get_attribute("aria-label")
                or ""
            )
            if (
                "reseña" not in aria_label.lower()
                and "review" not in aria_label.lower()
            ):
                continue
            match = re.search(r"(\d[\d.,\s]*)", aria_label)
            if match:
                num_resenas = int(
                    re.sub(r"\D", "", match.group(1))
                )
                break
    except Exception as error:
        print(f"[Scraper] Error leyendo panel: {error}")
    return rating, num_resenas
def extraer_resenas_negativas(
    page,
    max_resenas: int = 5,
    max_tarjetas: int = 60,
    max_scrolls: int = 8
) -> list:
    """
    Recorre progresivamente las reseñas visibles, con límites
    de tarjetas y desplazamientos.
    """
    reviews = []
    textos_vistos = set()
    tarjetas_vistas = set()
    try:
        # 1. Esperar la pestaña de reseñas
        tab_resenas = page.get_by_role(
            "tab",
            name=re.compile(r"Reseñas|Opiniones", re.IGNORECASE)
        )
        try:
            tab_resenas.first.wait_for(
                state="visible",
                timeout=10000
            )
            tab_resenas.first.click(timeout=5000)
            print("[Reseñas] Pestaña abierta.")
        except Exception as e:
            print(f"[Reseñas] No se pudo abrir la pestaña: {e}")
            return reviews
        # 2. Esperar a que carguen las tarjetas de reseñas
        selector_tarjetas = 'div.jftiEf[data-review-id]'
        try:
            page.locator(selector_tarjetas).first.wait_for(
                state="attached",
                timeout=12000
            )
            print("[Reseñas] Tarjetas cargadas correctamente.")
            # Esperar a que Google Maps estabilice el panel
            page.wait_for_timeout(2000)
        except PlaywrightTimeoutError:
            print(
                "[Reseñas] No se encontraron tarjetas "
                "con el selector principal."
            )
            return reviews
        # 3. Revisar tarjetas y desplazar el listado
        sin_nuevas = 0
        cantidad_anterior = 0
        for intento in range(max_scrolls + 1):
            tarjetas = page.locator(selector_tarjetas)
            cantidad = tarjetas.count()
            for i in range(cantidad):
                if len(reviews) >= max_resenas:
                    break
                if len(tarjetas_vistas) >= max_tarjetas:
                    break
                try:
                    tarjeta = tarjetas.nth(i)
                    review_id = tarjeta.get_attribute(
                        "data-review-id"
                    )
                    if not review_id:
                        continue
                    if review_id in tarjetas_vistas:
                        continue
                    tarjetas_vistas.add(review_id)
                    # Leer estrellas; no asumir que faltantes son 1
                    star_el = tarjeta.locator(
                        'span.kvMYJc[aria-label]'
                    )
                    if star_el.count() == 0:
                        continue
                    aria_star = (
                        star_el.first.get_attribute("aria-label") or ""
                    )
                    match_s = re.search(r"(\d+)", aria_star)
                    if not match_s:
                        continue
                    estrellas = int(match_s.group(1))
                    if not (1 <= estrellas <= 3):
                        continue
                    # Expandir texto solamente en reseñas negativas
                    botones_mas = tarjeta.locator(
                        'button:has-text("Más"), '
                        'button[aria-label*="ver más"]'
                    )
                    if botones_mas.count() > 0:
                        try:
                            botones_mas.first.click(timeout=1500)
                        except Exception:
                            pass
                    texto_el = tarjeta.locator(
                        "span.wiI7pd"
                    )
                    if texto_el.count() == 0:
                        continue
                    texto = texto_el.first.inner_text().strip()
                    if not texto or texto in textos_vistos:
                        continue
                    autor_el = tarjeta.locator("div.d4r55")
                    autor = (
                        autor_el.first.inner_text().strip()
                        if autor_el.count() > 0
                        else "Usuario Anónimo"
                    )
                    textos_vistos.add(texto)
                    reviews.append({
                        "autor": autor,
                        "fecha": None,
                        "texto": texto,
                        "estrellas": estrellas
                    })
                    print(
                        f"[Reseñas] Negativa encontrada: "
                        f"{estrellas}★"
                    )
                except Exception as e:
                    print(f"[Reseñas] Error en tarjeta: {e}")
                    continue
            print(
                f"[Reseñas] Scroll {intento}/{max_scrolls} | "
                f"Tarjetas revisadas: {len(tarjetas_vistas)} | "
                f"Negativas: {len(reviews)}"
            )
            # Detectar cuando dejan de aparecer reseñas nuevas
            if len(tarjetas_vistas) == cantidad_anterior:
                sin_nuevas += 1
            else:
                sin_nuevas = 0
            cantidad_anterior = len(tarjetas_vistas)
            if sin_nuevas >= 2:
                print(
                    "[Reseñas] No aparecen nuevas opiniones. "
                    "Se detiene la búsqueda."
                )
                break
            # Condiciones de finalización
            if len(reviews) >= max_resenas:
                break
            if len(tarjetas_vistas) >= max_tarjetas:
                break
            if intento >= max_scrolls:
                break
            # 4. Desplazar el panel de reseñas
            try:
                if page.locator(selector_tarjetas).count() == 0:
                    print(
                        "[Reseñas] No hay tarjetas disponibles "
                        "para desplazar."
                    )
                    break
                # Buscar el contenedor desplazable
                panel_resenas = page.locator(
                    'div[data-review-id]'
                ).first.locator(
                    'xpath=ancestor::*['
                    'contains(@class, "m6QErb")'
                    ' and contains(@class, "DxyBCb")'
                    '][1]'
                )
                if panel_resenas.count() > 0:
                    panel_resenas.evaluate(
                        "(element) => element.scrollBy(0, 1200)"
                    )
                else:
                    # Alternativa: desplazar la última reseña
                    ultima_tarjeta = page.locator(
                        selector_tarjetas
                    ).last
                    ultima_tarjeta.scroll_into_view_if_needed(
                        timeout=3000
                    )
                    ultima_tarjeta.hover(timeout=3000)
                    page.mouse.wheel(0, 1200)
                micro_pausa(1.0, 1.5)
            except Exception as e:
                print(
                    f"[Reseñas] No se pudo desplazar: {e}"
                )
                break
        print(
            f"[Reseñas] Finalizado. "
            f"Negativas extraídas: {len(reviews)}"
        )
    except Exception as e:
        print(f"[Reseñas] Error general: {e}")
    return reviews
def extraer_negocios_google_maps(
    ciudad: str,
    rubro: str,
    max_resultados: int = 2,
    rating_min: float = 1.5,
    rating_max: float = 3.5,
    resenas_min: int = 10,
    max_tarjetas_negocios: int = 60,
    max_scrolls_negocios: int = 8,
    debug_interactivo: bool = False,
) -> list:
    """Busca negocios en Maps y devuelve leads con análisis o correo general."""
    query = f"{rubro} en {ciudad}"
    url = f"https://www.google.com/maps/search/{quote(query)}"
    leads_encontrados = []
    fecha_actual = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    print(f"\n[RepuSense Pipeline] Buscando '{rubro}' en '{ciudad}'...")
    print(
        f"[Filtros: Rating {rating_min}★ - {rating_max}★ "
        f"| Min. Reseñas >= {resenas_min}]"
    )
    headless_mode = os.getenv("SCRAPER_HEADLESS", "True").lower() in (
        "true", "1", "yes"
    )
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless_mode)
        context = browser.new_context(locale="es-ES")
        page = context.new_page()
        page.set_default_timeout(8000)
        # Reducir recursos descargados sin bloquear scripts o estilos necesarios.
        page.route(
            "**/*",
            lambda route: (
                route.abort()
                if route.request.resource_type in ("image", "media", "font")
                else route.continue_()
            ),
        )
        try:
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=35000)
            except PlaywrightTimeoutError:
                print("[Scraper] La navegación demoró; comprobando si cargó Maps...")
            try:
                consentimiento = page.locator(
                    "button:has-text('Rechazar todo'), "
                    "button:has-text('Aceptar todo')"
                )
                if consentimiento.count() > 0:
                    consentimiento.first.click(timeout=1500)
            except Exception:
                pass
            try:
                page.locator('div[role="feed"]').first.wait_for(timeout=12000)
            except PlaywrightTimeoutError:
                print("[Scraper] No se encontró el listado de negocios.")
                return leads_encontrados
            # Recorrer progresivamente los negocios de Google Maps
            feed = page.locator('div[role="feed"]').first
            nombres_vistos = set()
            tarjetas_inspeccionadas = set()
            scrolls_realizados = 0
            intentos_sin_nuevas = 0
            total_inspeccionadas = 0
            while (
                len(leads_encontrados) < max_resultados
                and total_inspeccionadas < max_tarjetas_negocios
            ):
                cards = feed.locator('div[role="article"]')
                total_cards = cards.count()
                print(
                    f"\n[Negocios] Tarjetas disponibles: {total_cards} "
                    f"| Inspeccionadas: {total_inspeccionadas} "
                    f"| Leads: {len(leads_encontrados)}/{max_resultados}"
                )
                nuevas_en_ronda = 0
                for i in range(total_cards):
                    if (
                        len(leads_encontrados) >= max_resultados
                        or total_inspeccionadas >= max_tarjetas_negocios
                    ):
                        break
                    nombre_preview = f"tarjeta {i + 1}"
                    try:
                        # Volver a localizar la tarjeta porque Maps
                        # puede actualizar el listado dinámicamente
                        card = feed.locator(
                            'div[role="article"]'
                        ).nth(i)
                        card_text = card.inner_text(timeout=3000)
                        nombre_preview = card_text.split("\n")[0].strip()
                        if not nombre_preview:
                            continue
                        clave = nombre_preview.casefold()
                        if clave in tarjetas_inspeccionadas:
                            continue
                        tarjetas_inspeccionadas.add(clave)
                        total_inspeccionadas += 1
                        nuevas_en_ronda += 1
                        # Obtener rating
                        match_rating = re.search(
                            r"(\d+[.,]\d+)\s*(?:★|estrellas)?",
                            card_text
                        )
                        rating = (
                            float(
                                match_rating.group(1).replace(",", ".")
                            )
                            if match_rating else 0.0
                        )
                        # Obtener cantidad de reseñas
                        match_resenas = re.search(
                            r"\((\d[\d.,]*)\)",
                            card_text
                        )
                        num_resenas = (
                            int(
                                re.sub(
                                    r"\D", "",
                                    match_resenas.group(1)
                                )
                            )
                            if match_resenas else 0
                        )
                        if clave in nombres_vistos:
                            print(f"[DUPLICADO] {nombre_preview}")
                            continue
                        # Abrir ficha del negocio con reintento
                        if not abrir_ficha_con_reintento(
                            page,
                            nombre_preview,
                            max_intentos=2
                        ):
                            print(
                                f"[Scraper] No se pudo abrir "
                                f"'{nombre_preview}' después "
                                f"de 2 intentos. Se omite."
                            )
                            continue
                        nombre = page.locator(
                            "h1.DUwDvf"
                        ).first.inner_text().strip()
                        if not nombre:
                            nombre = nombre_preview
                        # Confirmar rating y cantidad de reseñas desde el panel
                        rating_panel, num_resenas_panel = obtener_datos_panel_negocio(page)
                        if rating_panel is not None:
                            rating = rating_panel
                        if num_resenas_panel is not None:
                            num_resenas = num_resenas_panel
                        print(
                            f"[PANEL] {nombre} | "
                            f"Rating: {rating} | "
                            f"Reseñas: {num_resenas}"
                        )
                        # Aplicar filtros con los datos actualizados
                        motivos = []
                        if not rating_min <= rating <= rating_max:
                            motivos.append(
                                f"rating fuera del rango {rating_min}-{rating_max}"
                            )
                        if num_resenas < resenas_min:
                            motivos.append(
                                f"reseñas insuficientes ({num_resenas} < {resenas_min})"
                            )
                        if motivos:
                            print(
                                f"[DESCARTADO] {nombre} "
                                f"| Motivo: {', '.join(motivos)}"
                            )
                            continue
                        if nombre.casefold() in nombres_vistos:
                            continue
                        nombres_vistos.add(nombre.casefold())
                        print(
                            f"-> [CALIFICA] {nombre} "
                            f"({rating}★ | {num_resenas} reseñas)"
                        )
                        # Sitio web (dato opcional)
                        web = None
                        try:
                            web_el = page.locator(
                                'a[data-item-id="authority"]'
                            ).first
                            if web_el.count() > 0:
                                web = web_el.get_attribute(
                                    "href",
                                    timeout=2000
                                )
                        except PlaywrightTimeoutError:
                            print(
                                f"[Scraper] No se pudo leer la web "
                                f"de '{nombre}'. Se continúa sin web."
                            )

                        # Enriquecimiento de contactos desde la web del negocio
                        datos_contacto = {"email": None, "linkedin": None}

                        if web:
                            try:
                                with concurrent.futures.ThreadPoolExecutor() as executor:
                                    future = executor.submit(extraer_contacto_web, web)
                                    datos_contacto = future.result(timeout=15)
                            except Exception as exc:
                                print(
                                    f"[Enrichment] No se pudieron obtener "
                                    f"contactos de '{nombre}': {exc}"
                                )

                        # Teléfono
                        telefono = None
                        try:
                            tel_el = page.locator(
                                'button[data-item-id^="phone:"]'
                            ).first
                            if tel_el.count() > 0:
                                telefono_raw = tel_el.inner_text(
                                    timeout=2000
                                ).strip()
                                telefono = re.sub(
                                    r"[^\d+\s\-()]",
                                    "",
                                    telefono_raw
                                ).strip() or None
                        except PlaywrightTimeoutError:
                            print(
                                f"[Scraper] No se pudo leer el teléfono "
                                f"de '{nombre}'. Se continúa sin teléfono."
                            )
                        # Extraer reseñas negativas
                        quejas = extraer_resenas_negativas(
                            page,
                            max_resenas=5,
                            max_tarjetas=60,
                            max_scrolls=8
                        )
                        if quejas:
                            print(
                                f"   Quejas recolectadas: {len(quejas)}. "
                                "Analizando con Gemini..."
                            )
                            enriquecimiento = analizar_con_ia(
                                nombre, rubro, ciudad, quejas
                            )
                        else:
                            print(
                                "[Aviso] No se encontraron reseñas negativas accesibles. "
                                "Se generará un correo comercial general."
                            )
                            enriquecimiento = fallback_local(nombre)
                        lead = {
                            "id": (
                                f"lead-"
                                f"{re.sub(r'[^a-z0-9]', '', ciudad.lower())[:3]}-"
                                f"{random.randint(100, 999)}"
                            ),
                            "nombre": nombre,
                            "rubro": rubro,
                            "ciudad": ciudad,
                            "fuente": "Google Maps",
                            "rating": rating,
                            "numResenas": num_resenas,
                            "telefono": telefono,
                            "web": web,
                            "email": datos_contacto.get("email"),
                            "linkedin": datos_contacto.get("linkedin"),
                            "problema": enriquecimiento["problema"],
                            "confianzaIA": enriquecimiento["confianzaIA"],
                            "reviewsNegativas": quejas,
                            "draft": enriquecimiento["draft"],
                            "estado": "nuevo",
                            "actualizado": False,
                            "ultimoEscaneo": fecha_actual,
                            "vendedor": None,
                        }
                        leads_encontrados.append(lead)
                    except Exception as exc:
                        print(
                            f"[Scraper] Error procesando "
                            f"'{nombre_preview}': {exc}"
                        )
                        continue
                # Detener si ya conseguimos los leads necesarios
                if len(leads_encontrados) >= max_resultados:
                    break
                # Detener si alcanzamos el límite de tarjetas
                if total_inspeccionadas >= max_tarjetas_negocios:
                    break
                # Evitar desplazamientos ilimitados
                if scrolls_realizados >= max_scrolls_negocios:
                    print(
                        "[Negocios] Se alcanzó el límite de scrolls."
                    )
                    break
                # Detectar rondas sin nuevas tarjetas
                if nuevas_en_ronda == 0:
                    intentos_sin_nuevas += 1
                else:
                    intentos_sin_nuevas = 0
                if intentos_sin_nuevas >= 2:
                    print(
                        "[Negocios] No aparecen nuevos negocios. "
                        "Se detiene la búsqueda."
                    )
                    break
                # Volver al listado y cargar más negocios
                try:

                    feed.scroll_into_view_if_needed(
                        timeout=3000
                    )
                    feed.hover(timeout=3000)
                    page.mouse.wheel(0, 2500)
                    page.wait_for_timeout(1200)
                    scrolls_realizados += 1
                    print(
                        f"[Negocios] Scroll "
                        f"{scrolls_realizados}/{max_scrolls_negocios}"
                    )
                except Exception as exc:
                    print(
                        f"[Negocios] No se pudo continuar "
                        f"el scroll: {exc}"
                    )
                    break
            print(
                f"\n[Negocios] Búsqueda finalizada. "
                f"Tarjetas inspeccionadas: {total_inspeccionadas} "
                f"| Leads encontrados: {len(leads_encontrados)}"
            )

        finally:
            # Mantener Chromium abierto durante las pruebas locales
            if not headless_mode and debug_interactivo:
                print("\n[DEBUG] El navegador seguirá abierto.")
                print("[DEBUG] Revisá Google Maps y sus menús.")
                try:
                    input(
                        "\nPresioná ENTER en la terminal "
                        "para cerrar Chromium..."
                    )
                except EOFError:
                    pass
            context.close()
            browser.close()
    return leads_encontrados
if __name__ == "__main__":
    leads = extraer_negocios_google_maps(
        ciudad="Buenos Aires",
        rubro="clinicas",
        max_resultados=5,
        rating_min=1.5,
        rating_max=3.5,
        resenas_min=10,
        max_tarjetas_negocios=60,
        max_scrolls_negocios=8,
        debug_interactivo=True,
    )
    print("\n--- OBJETO FINAL LISTO PARA FRONTEND / PERSISTENCIA ---")
    print(json.dumps(leads, indent=2, ensure_ascii=False))