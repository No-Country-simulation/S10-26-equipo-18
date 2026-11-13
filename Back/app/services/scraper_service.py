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


def micro_pausa(min_s: float = 0.2, max_s: float = 0.4) -> None:
    """Pausa breve para permitir actualizaciones del DOM."""
    time.sleep(random.uniform(min_s, max_s))


def parsear_tarjetas_feed_en_bloque(page) -> list:
    """
    Extrae la metadata de todas las tarjetas visibles en el feed
    mediante una única ejecución en JavaScript (1 solo viaje de red CDP).
    Esto reduce drásticamente la latencia en Browserless remoto.
    """
    js_code = """
    () => {
        const feed = document.querySelector('div[role="feed"]');
        if (!feed) return [];
        const articles = feed.querySelectorAll('div[role="article"]');
        const items = [];
        
        articles.forEach((art, idx) => {
            const fullText = art.innerText || '';
            const lines = fullText.split('\\n').map(l => l.trim()).filter(Boolean);
            const name = lines[0] || '';
            if (!name) return;

            // Extraer Rating: ej "3,2", "3.2", "3,2 estrellas"
            let rating = null;
            const ratingMatch = fullText.match(/(\\d+[.,]\\d+)\\s*(?:★|estrellas)?/);
            if (ratingMatch) {
                rating = parseFloat(ratingMatch[1].replace(',', '.'));
            }

            // Extraer cantidad de reseñas: ej "(15)", "(1.230)", "(14 reseñas)"
            let reviews = null;
            const revMatch = fullText.match(/\\(([\\d.,]+)\\)/) || fullText.match(/([\\d.,]+)\\s*(?:reseñas?|reviews?)/i);
            if (revMatch) {
                reviews = parseInt(revMatch[1].replace(/\\D/g, ''), 10);
            }

            // Link a la ficha si está presente
            const link = art.querySelector('a[href*="/maps/place/"]');
            const href = link ? link.getAttribute('href') : null;

            items.push({
                index: idx,
                nombre: name,
                rating: rating,
                numResenas: reviews,
                href: href
            });
        });
        return items;
    }
    """
    try:
        return page.evaluate(js_code) or []
    except Exception as e:
        print(f"[Scraper] Error evaluando feed en bloque: {e}")
        return []


def volver_al_feed(page, timeout_ms: int = 5000) -> bool:
    """
    CORRECCIÓN CRÍTICA:
    Regresa al feed principal de resultados después de haber abierto
    la ficha de un negocio, evitando que el scraper quede atrapado.
    """
    try:
        # 1. Intentar hacer clic en el botón Atrás oficial de Google Maps
        btn_atras = page.locator(
            'button[aria-label*="Atrás" i], '
            'button[aria-label*="Back" i], '
            'button[jsaction*="back"], '
            'button[aria-label*="Volver" i]'
        ).first

        if btn_atras.count() > 0 and btn_atras.is_visible():
            btn_atras.click(timeout=2500)
            page.locator('div[role="feed"]').first.wait_for(
                state="visible",
                timeout=timeout_ms
            )
            return True
    except Exception:
        pass

    try:
        # 2. Alternativa: navegación histórica del navegador
        page.go_back(timeout=3000)
        page.locator('div[role="feed"]').first.wait_for(
            state="visible",
            timeout=timeout_ms
        )
        return True
    except Exception:
        pass

    return False


def esperar_ficha_negocio(page, nombre_esperado: str, timeout_ms: int = 6000) -> bool:
    """
    Espera a que Google Maps abra la ficha del negocio seleccionado.
    """
    limite = time.monotonic() + timeout_ms / 1000
    while time.monotonic() < limite:
        try:
            titulo = page.locator("h1.DUwDvf").first
            if titulo.count() > 0 and titulo.is_visible():
                return True
        except Exception:
            pass
        page.wait_for_timeout(250)
    return False


def obtener_datos_panel_negocio(page) -> tuple:
    """
    Obtiene el rating y la cantidad de reseñas confirmadas
    desde la ficha abierta de Google Maps.
    """
    rating = None
    num_resenas = None
    try:
        rating_locator = page.locator(
            "div.F7nice span[aria-hidden='true']"
        ).first
        if rating_locator.count() > 0:
            texto_rating = rating_locator.inner_text(timeout=1500).strip()
            match = re.search(r"\d+[.,]\d+", texto_rating)
            if match:
                rating = float(match.group(0).replace(",", "."))

        resenas_locator = page.locator(
            "div.F7nice span[aria-label*='reseña' i], "
            "div.F7nice span[aria-label*='review' i]"
        )

        for i in range(resenas_locator.count()):
            aria_label = resenas_locator.nth(i).get_attribute("aria-label") or ""
            match = re.search(
                r"(\d[\d.,\s]*)\s*(?:reseñas?|reviews?)",
                aria_label,
                re.IGNORECASE
            )
            if match:
                num_resenas = int(re.sub(r"\D", "", match.group(1)))
                break
    except Exception as error:
        print(f"[Scraper] Error leyendo panel: {error}")

    return rating, num_resenas


def ordenar_resenas_mas_bajas(page) -> bool:
    """
    Cambia el filtro de reseñas a 'Más bajas' para obtener de inmediato
    las reseñas negativas sin tener que hacer scrolls infinitos.
    """
    try:
        btn_ordenar = page.locator(
            'button[aria-label*="Ordenar" i], '
            'button[data-value="Ordenar"], '
            'button:has-text("Ordenar"), '
            'button[aria-label*="Sort" i]'
        ).first

        if btn_ordenar.count() > 0 and btn_ordenar.is_visible():
            btn_ordenar.click(timeout=2000)
            page.wait_for_timeout(350)

            opcion_bajas = page.locator(
                'div[role="menuitemradio"]:has-text("baja"), '
                'div[role="menuitem"]:has-text("baja"), '
                'div[role="menuitemradio"]:has-text("lowest" i)'
            ).first

            if opcion_bajas.count() > 0 and opcion_bajas.is_visible():
                opcion_bajas.click(timeout=2000)
                page.wait_for_timeout(800)
                print("[Reseñas] Filtro 'Más bajas' aplicado.")
                return True
    except Exception:
        pass
    return False


def extraer_resenas_negativas(
    page,
    max_resenas: int = 5,
    max_scrolls: int = 2
) -> list:
    """
    Extrae hasta 5 reseñas negativas optimizando la interacción por bloques JS.
    """
    reviews = []
    try:
        # 1. Pestaña de reseñas
        tab_resenas = page.get_by_role(
            "tab",
            name=re.compile(r"Reseñas|Opiniones|Reviews", re.IGNORECASE)
        ).first

        try:
            tab_resenas.wait_for(state="visible", timeout=4000)
            tab_resenas.click(timeout=3000)
            print("[Reseñas] Pestaña de reseñas abierta.")
        except Exception:
            return reviews

        # 2. Ordenar por más bajas para capturar las quejas de inmediato
        ordenar_resenas_mas_bajas(page)

        selector_tarjetas = 'div.jftiEf[data-review-id]'
        try:
            page.locator(selector_tarjetas).first.wait_for(
                state="attached",
                timeout=5000
            )
        except PlaywrightTimeoutError:
            print("[Reseñas] No se encontraron tarjetas de reseñas.")
            return reviews

        # 3. Expandir textos truncados ("Más" / "Ver más") de una sola vez
        try:
            page.evaluate("""
                () => {
                    const btns = document.querySelectorAll('button.w8nwRe, button[aria-label*="ver más" i]');
                    btns.forEach(b => b.click());
                }
            """)
        except Exception:
            pass

        # 4. Extraer reseñas negativas mediante evaluate en un solo paso
        js_extract_reviews = """
        () => {
            const cards = document.querySelectorAll('div.jftiEf[data-review-id]');
            const results = [];
            cards.forEach(card => {
                if (results.length >= 5) return;
                
                // Estrellas
                let stars = 0;
                const starEl = card.querySelector('span.kvMYJc[aria-label]');
                if (starEl) {
                    const m = (starEl.getAttribute('aria-label') || '').match(/(\\d+)/);
                    if (m) stars = parseInt(m[1], 10);
                }
                
                // Filtrar solo negativas (1 a 3 estrellas)
                if (stars < 1 || stars > 3) return;

                const textEl = card.querySelector('span.wiI7pd');
                const text = textEl ? textEl.innerText.trim() : '';
                if (!text) return;

                const authorEl = card.querySelector('div.d4r55');
                const author = authorEl ? authorEl.innerText.trim() : 'Usuario Anónimo';

                results.push({
                    autor: author,
                    fecha: null,
                    texto: text,
                    estrellas: stars
                });
            });
            return results;
        }
        """

        for intento in range(max_scrolls + 1):
            reviews = page.evaluate(js_extract_reviews) or []
            if len(reviews) >= max_resenas:
                break

            if intento < max_scrolls:
                # Si faltan reseñas, hacer un scroll rápido del contenedor
                try:
                    page.evaluate("""
                        () => {
                            const panel = document.querySelector('div.m6QErb.DxyBCb');
                            if (panel) panel.scrollBy(0, 1000);
                        }
                    """)
                    micro_pausa(0.4, 0.7)
                except Exception:
                    break

        print(f"[Reseñas] Negativas extraídas: {len(reviews)}")
    except Exception as e:
        print(f"[Reseñas] Error general al extraer reseñas: {e}")

    return reviews[:max_resenas]


def extraer_negocios_google_maps(
    ciudad: str,
    rubro: str,
    max_resultados: int = 2,
    rating_min: float = 1.5,
    rating_max: float = 3.5,
    resenas_min: int = 10,
    max_tarjetas_negocios: int = 40,
    max_scrolls_negocios: int = 5,
    debug_interactivo: bool = False,
) -> list:
    """Busca negocios en Google Maps y devuelve leads calificados con análisis."""
    query = f"{rubro} en {ciudad}"
    url = f"https://www.google.com/maps/search/{quote(query)}?hl=es"
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
    browserless_url = os.getenv("BROWSERLESS_URL", "").strip()

    if os.getenv("RENDER") and not browserless_url:
        raise RuntimeError(
            "BROWSERLESS_URL no está configurada en Render. "
            "El scraper necesita Browserless para ejecutarse."
        )

    with sync_playwright() as p:
        if browserless_url:
            print("[Browserless] Conectando al navegador remoto...")
            browser = p.chromium.connect_over_cdp(
                browserless_url,
                timeout=60000,
            )
            print("[Browserless] Conexión establecida correctamente.")
        else:
            print("[Playwright] Iniciando Chromium local...")
            browser = p.chromium.launch(headless=headless_mode)

        context = browser.new_context(locale="es-ES")
        page = context.new_page()
        page.set_default_timeout(7000)

        # Bloquear imágenes, fuentes, estilos pesados y medios para máxima velocidad
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
                page.goto(url, wait_until="domcontentloaded", timeout=25000)
            except PlaywrightTimeoutError:
                print("[Scraper] La navegación demoró; comprobando si cargó Maps...")

            # Gestionar consentimiento de Google (cookies)
            try:
                consentimiento = page.get_by_role(
                    "button",
                    name=re.compile(
                        r"Rechazar todo|Aceptar todo|Reject all|Accept all",
                        re.IGNORECASE,
                    ),
                )
                if consentimiento.count() > 0:
                    consentimiento.first.click(timeout=3000)
                    print("[Scraper] Consentimiento de Google gestionado.")
            except Exception:
                pass

            try:
                page.locator('div[role="feed"]').first.wait_for(timeout=15000)
            except PlaywrightTimeoutError as error:
                print("[Scraper] No se encontró el listado de negocios.")
                raise RuntimeError(
                    "Google Maps no cargó el listado de negocios. "
                    "Revisar consentimiento o acceso desde Browserless."
                ) from error

            nombres_inspeccionados = set()
            scrolls_realizados = 0

            while (
                len(leads_encontrados) < max_resultados
                and len(nombres_inspeccionados) < max_tarjetas_negocios
                and scrolls_realizados <= max_scrolls_negocios
            ):
                # 1. Analizar todas las tarjetas del feed de una vez en JavaScript
                candidatos = parsear_tarjetas_feed_en_bloque(page)
                print(
                    f"\n[Negocios] Tarjetas visibles: {len(candidatos)} "
                    f"| Leads encontrados: {len(leads_encontrados)}/{max_resultados}"
                )

                encontrado_en_ronda = False

                for cand in candidatos:
                    if len(leads_encontrados) >= max_resultados:
                        break

                    nombre_cand = cand["nombre"]
                    clave = nombre_cand.casefold().strip()

                    if clave in nombres_inspeccionados:
                        continue
                    nombres_inspeccionados.add(clave)

                    rating = cand["rating"]
                    num_resenas = cand["numResenas"]

                    # FILTRO RÁPIDO EN LISTA: descartar si no califica sin abrir la ficha
                    if rating is not None and not (rating_min <= rating <= rating_max):
                        print(f"[FILTRO RÁPIDO] {nombre_cand} | Rating: {rating}★ fuera de rango.")
                        continue

                    if num_resenas is not None and num_resenas < resenas_min:
                        print(f"[FILTRO RÁPIDO] {nombre_cand} | Reseñas: {num_resenas} < {resenas_min}.")
                        continue

                    # Si el negocio califica en el listado, abrir su ficha
                    print(f"-> [EVALUANDO FICHA] {nombre_cand} ({rating}★ | {num_resenas} reseñas)")
                    
                    tarjetas_feed = page.locator('div[role="feed"] div[role="article"]')
                    if cand["index"] >= tarjetas_feed.count():
                        continue

                    try:
                        tarjetas_feed.nth(cand["index"]).click(timeout=4000)
                    except Exception as e:
                        print(f"[Scraper] No se pudo hacer clic en '{nombre_cand}': {e}")
                        continue

                    if not esperar_ficha_negocio(page, nombre_cand, timeout_ms=5000):
                        print(f"[Scraper] No se confirmó apertura de '{nombre_cand}'. Regresando.")
                        volver_al_feed(page)
                        continue

                    # Confirmar datos en panel
                    r_panel, n_panel = obtener_datos_panel_negocio(page)
                    if r_panel is not None:
                        rating = r_panel
                    if n_panel is not None:
                        num_resenas = n_panel

                    # Validación de seguridad con datos del panel
                    if not (rating_min <= (rating or 0.0) <= rating_max) or (num_resenas or 0) < resenas_min:
                        print(f"[DESCARTADO EN PANEL] {nombre_cand} ({rating}★ | {num_resenas} reseñas)")
                        volver_al_feed(page)
                        continue

                    encontrado_en_ronda = True
                    print(f"-> [CALIFICA CONFIRMADO] {nombre_cand} ({rating}★ | {num_resenas} reseñas)")

                    # Teléfono y Web
                    telefono = None
                    try:
                        tel_el = page.locator('button[data-item-id^="phone:"]').first
                        if tel_el.count() > 0:
                            telefono_raw = tel_el.inner_text(timeout=1000).strip()
                            telefono = re.sub(r"[^\d+\s\-()]", "", telefono_raw).strip() or None
                    except Exception:
                        pass

                    web = None
                    try:
                        web_el = page.locator('a[data-item-id="authority"]').first
                        if web_el.count() > 0:
                            web = web_el.get_attribute("href", timeout=1000)
                    except Exception:
                        pass

                    # Reseñas negativas ordenadas
                    quejas = extraer_resenas_negativas(page, max_resenas=5, max_scrolls=2)

                    # Enriquecimiento web rápido (timeout acotado a 5s para no demorar)
                    datos_contacto = {"email": None, "linkedin": None}
                    if web:
                        try:
                            with concurrent.futures.ThreadPoolExecutor() as executor:
                                future = executor.submit(extraer_contacto_web, web)
                                datos_contacto = future.result(timeout=5)
                        except Exception:
                            pass

                    # Análisis con IA
                    if quejas:
                        print(f"   Quejas recolectadas: {len(quejas)}. Analizando con Gemini...")
                        enriquecimiento = analizar_con_ia(nombre_cand, rubro, ciudad, quejas)
                    else:
                        enriquecimiento = fallback_local(nombre_cand)

                    lead = {
                        "id": (
                            f"lead-"
                            f"{re.sub(r'[^a-z0-9]', '', ciudad.lower())[:3]}-"
                            f"{random.randint(100, 999)}"
                        ),
                        "nombre": nombre_cand,
                        "rubro": rubro,
                        "ciudad": ciudad,
                        "fuente": "Google Maps",
                        "rating": rating,
                        "numResenas": num_resenas,
                        "telefono": telefono,
                        "web": web,
                        "email": datos_contacto.get("email"),
                        "linkedin": datos_contacto.get("linkedin"),
                        "problema": enriquecimiento.get("problema", "sin_clasificar"),
                        "confianzaIA": enriquecimiento.get("confianzaIA", 0),
                        "reviewsNegativas": quejas,
                        "draft": enriquecimiento.get("draft", {}),
                        "estado": "nuevo",
                        "actualizado": False,
                        "ultimoEscaneo": fecha_actual,
                        "vendedor": None,
                    }
                    leads_encontrados.append(lead)

                    # CORRECCIÓN VITAL: Volver al feed antes de procesar la siguiente tarjeta
                    volver_al_feed(page)

                if len(leads_encontrados) >= max_resultados:
                    break

                # Desplazar el feed para cargar nuevos negocios
                try:
                    feed = page.locator('div[role="feed"]').first
                    if feed.count() > 0:
                        page.evaluate("""
                            () => {
                                const feed = document.querySelector('div[role="feed"]');
                                if (feed) feed.scrollBy(0, 1500);
                            }
                        """)
                        scrolls_realizados += 1
                        page.wait_for_timeout(1000)
                except Exception as exc:
                    print(f"[Negocios] No se pudo desplazar el feed: {exc}")
                    break

            print(
                f"\n[Negocios] Búsqueda finalizada. "
                f"Tarjetas inspeccionadas: {len(nombres_inspeccionados)} "
                f"| Leads encontrados: {len(leads_encontrados)}"
            )

        finally:
            context.close()
            browser.close()

    return leads_encontrados


if __name__ == "__main__":
    leads = extraer_negocios_google_maps(
        ciudad="Buenos Aires",
        rubro="clinicas",
        max_resultados=2,
        rating_min=1.5,
        rating_max=3.5,
        resenas_min=10,
    )
    print("\n--- OBJETO FINAL LISTO PARA FRONTEND / PERSISTENCIA ---")
    print(json.dumps(leads, indent=2, ensure_ascii=False))
