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
def _a_entero(texto):
    """'5.107' / '5,107' / '5 107' -> 5107. Devuelve None si no hay dígitos."""
    digitos = re.sub(r"\D", "", texto or "")
    return int(digitos) if digitos else None
def obtener_histograma_resenas(page) -> dict:
    """
    Lee el gráfico de barras de estrellas de la ficha.
    Devuelve {5: 2000, 4: 1008, 3: 714, 2: 527, 1: 858} o {} si no está.
    """
    histograma = {}
    try:
        filas = page.locator('tr[role="img"][aria-label]')
        for i in range(filas.count()):
            label = filas.nth(i).get_attribute("aria-label") or ""
            m = re.search(
                r"(\d)\s*(?:estrellas?|stars?)\s*,\s*([\d.,\s\u00a0]+)",
                label,
                re.IGNORECASE,
            )
            if m:
                histograma[int(m.group(1))] = _a_entero(m.group(2)) or 0
    except Exception as error:
        print(f"[Scraper] Error leyendo histograma: {error}")
    return histograma
def obtener_datos_panel_negocio(page):
    """
    Obtiene rating y cantidad de reseñas desde la ficha abierta.
    El conteo se busca en varios lugares porque Maps cambia el markup
    y el separador de miles (5.107 / 5,107).
    """
    rating = None
    num_resenas = None
    patron_label = re.compile(
        r"([\d][\d.,\s\u00a0]*)\s*(?:reseñas?|opiniones?|reviews?)",
        re.IGNORECASE,
    )
    try:
        bloque = page.locator("div.F7nice").first
        if bloque.count() > 0:
            # Rating
            rating_el = bloque.locator("span[aria-hidden='true']").first
            if rating_el.count() > 0:
                m = re.search(r"\d+[.,]\d+|\d+", rating_el.inner_text().strip())
                if m:
                    rating = float(m.group(0).replace(",", "."))
            # Conteo 1: cualquier aria-label con "reseñas/opiniones" dentro del bloque
            etiquetas = bloque.locator("[aria-label]")
            for i in range(etiquetas.count()):
                label = etiquetas.nth(i).get_attribute("aria-label") or ""
                m = patron_label.search(label)
                if m:
                    num_resenas = _a_entero(m.group(1))
                    break
            # Conteo 2: texto "3,5 (5.107)" del bloque
            if num_resenas is None:
                texto = bloque.inner_text(timeout=2000)
                m = re.search(r"\(([\d.,\s\u00a0]+)\)", texto)
                if m:
                    num_resenas = _a_entero(m.group(1))
        # Conteo 4 (independiente de clases CSS): texto del encabezado del panel
        if num_resenas is None or rating is None:
            texto = texto_panel_ficha(page)
            # Acotar al encabezado: lo que sigue al título (rating, conteo, categoría)
            titulo_el = page.locator("h1.DUwDvf").first
            titulo = (
                titulo_el.inner_text(timeout=1500).strip()
                if titulo_el.count() > 0
                else ""
            )
            if titulo and titulo in texto:
                texto = texto.split(titulo, 1)[1]
            texto = texto[:300]
            if rating is None:
                m = re.search(r"(\d[.,]\d)\s*\n?\s*\(", texto)
                if m:
                    rating = float(m.group(1).replace(",", "."))
            if num_resenas is None:
                m = re.search(r"\(([\d][\d.,\s\u00a0]*)\)", texto)
                if not m:
                    m = re.search(
                        r"([\d][\d.,\s\u00a0]*)\s*(?:reseñas?|opiniones?|reviews?)",
                        texto,
                        re.IGNORECASE,
                    )
                if m:
                    num_resenas = _a_entero(m.group(1))
    except Exception as error:
        print(f"[Scraper] Error leyendo panel: {error}")
    return rating, num_resenas
def abrir_pestana_resenas(page) -> bool:
    """Abre la pestaña de reseñas probando varias formas de localizarla."""
    patron = re.compile(r"Reseñas|Opiniones|Revisiones|Reviews", re.IGNORECASE)
    page.wait_for_timeout(1000)
    candidatos = [
        # El nombre accesible del tab es su aria-label ("Revisiones para X"),
        # no el texto visible ("Opiniones"), por eso get_by_role(name=...) falla.
        # Se filtra primero por el texto del DOM.
        page.locator('button[role="tab"]').filter(has_text=patron),
        page.locator(
            'button[role="tab"][aria-label*="Revisiones" i], '
            'button[role="tab"][aria-label*="Reseñas" i], '
            'button[role="tab"][aria-label*="Opiniones" i], '
            'button[role="tab"][aria-label*="Reviews" i]'
        ),
        page.get_by_role("tab", name=patron),
        page.get_by_role(
            "button", name=re.compile(r"^Más opiniones|^More reviews", re.IGNORECASE)
        ),
        page.locator('button[jsaction*="reviewChart"]'),
    ]
    for candidato in candidatos:
        try:
            candidato.first.wait_for(state="visible", timeout=3500)
            candidato.first.click(timeout=3000)
            page.wait_for_timeout(1500)
            return True
        except Exception:
            continue
    return False
def ordenar_por_mas_bajas(page) -> bool:
    """Ordena las reseñas de menor a mayor calificación."""
    try:
        boton = page.get_by_role(
            "button", name=re.compile(r"Ordenar|Sort", re.IGNORECASE)
        ).first
        boton.wait_for(state="visible", timeout=4000)
        boton.click(timeout=3000)
        opcion = page.locator(
            '[role="menuitemradio"], [role="menuitem"]'
        ).filter(has_text=re.compile(r"m[aá]s baja|lowest", re.IGNORECASE)).first
        opcion.wait_for(state="visible", timeout=3000)
        opcion.click(timeout=3000)
        page.wait_for_timeout(2000)
        print("[Reseñas] Ordenadas por calificación más baja.")
        return True
    except Exception as e:
        print(f"[Reseñas] No se pudo ordenar por más bajas: {e}")
        return False
SELECTORES_RESENAS = [
    "div.jftiEf[data-review-id]",
    "div[data-review-id][aria-label]",
    "div[data-review-id]",
]
def detectar_selector_resenas(page, timeout_ms: int = 0):
    """Devuelve el primer selector de tarjetas de reseña que tenga resultados."""
    limite = time.monotonic() + timeout_ms / 1000
    while True:
        for selector in SELECTORES_RESENAS:
            try:
                if page.locator(selector).count() > 0:
                    return selector
            except Exception:
                pass
        if time.monotonic() >= limite:
            return None
        page.wait_for_timeout(400)
_JS_SCROLL_PANEL = """(dy) => {
  // Parte del título de la ficha abierta y sube hasta el primer contenedor
  // desplazable. Así no se confunde con el listado de resultados.
  const hs = [...document.querySelectorAll('h1.DUwDvf')];
  const h = hs.find(e => e.offsetParent !== null) || hs[0];
  let el = h;
  while (el) {
    const s = getComputedStyle(el);
    const scroll = s.overflowY === 'auto' || s.overflowY === 'scroll';
    if (scroll && el.scrollHeight > el.clientHeight + 20) {
      el.scrollBy(0, dy);
      return true;
    }
    el = el.parentElement;
  }
  return false;
}"""
_JS_PANEL_FICHA = """(modo) => {
  // Devuelve el HTML o el texto del panel de la ficha (el que contiene el h1).
  const hs = [...document.querySelectorAll('h1.DUwDvf')];
  const h = hs.find(e => e.offsetParent !== null) || hs[0];
  if (!h) return '';
  let el = h.closest('[role="main"]');
  if (!el) {
    el = h;
    for (let i = 0; i < 8 && el.parentElement; i++) el = el.parentElement;
  }
  return modo === 'html' ? el.outerHTML : el.innerText;
}"""
def texto_panel_ficha(page) -> str:
    """Texto visible del panel de la ficha abierta (no del listado)."""
    try:
        return page.evaluate(_JS_PANEL_FICHA, "text") or ""
    except Exception:
        return ""
def scrollear_panel(page, dy: int = 1400) -> None:
    """
    Scrollea el panel lateral de la ficha partiendo de su título.
    Si no lo logra, pone el mouse sobre el panel de la ficha y usa la rueda.
    """
    try:
        if page.evaluate(_JS_SCROLL_PANEL, dy):
            return
    except Exception:
        pass
    try:
        page.locator("h1.DUwDvf").first.hover(timeout=2000)
        page.mouse.wheel(0, dy)
    except Exception:
        pass
def cargar_seccion_resenas(page, intentos: int = 10) -> bool:
    """
    En algunas variantes de Maps no hay pestaña de reseñas: viven en la
    vista general y se cargan por secciones al scrollear el panel.
    """
    for _ in range(intentos):
        if detectar_selector_resenas(page) is not None:
            return True
        scrollear_panel(page, 1400)
        page.wait_for_timeout(800)
    return detectar_selector_resenas(page) is not None
def abrir_mas_resenas(page) -> bool:
    """Intenta expandir la lista completa con 'Más reseñas / Más opiniones'."""
    candidatos = [
        page.get_by_role(
            "button",
            name=re.compile(
                r"^M[aá]s (?:reseñas|opiniones)|^More reviews", re.IGNORECASE
            ),
        ),
        page.locator('button[jsaction*="moreReviews"]'),
    ]
    for candidato in candidatos:
        try:
            candidato.first.wait_for(state="visible", timeout=2500)
            candidato.first.scroll_into_view_if_needed(timeout=2000)
            candidato.first.click(timeout=3000)
            page.wait_for_timeout(1500)
            return True
        except Exception:
            continue
    return False
def volcar_debug_ficha(page, etiqueta: str = "ficha") -> None:
    """Guarda el HTML del panel de la FICHA (no del listado) + captura."""
    try:
        carpeta = Path(__file__).resolve().parent / "debug_scraper"
        carpeta.mkdir(exist_ok=True)
        marca = datetime.now().strftime("%H%M%S")
        base = carpeta / f"{etiqueta}_{marca}"
        html = page.evaluate(_JS_PANEL_FICHA, "html") or ""
        if not html:
            print("[DEBUG] No se encontró el panel de la ficha; se guarda toda la página.")
            html = page.content()
        base.with_suffix(".html").write_text(html, encoding="utf-8")
        page.screenshot(path=str(base.with_suffix(".png")))
        print(f"[DEBUG] Panel guardado en {base.with_suffix('.html')}")
    except Exception as error:
        print(f"[DEBUG] No se pudo volcar el panel: {error}")
def es_vista_limitada(page) -> bool:
    """
    Maps muestra un banner informativo 'Estás en una vista limitada de Google Maps'
    en la parte inferior del mapa, pero eso NO significa que no tenga la pestaña de reseñas.
    Solo es limitada real si NO tiene tabs ni reseñas disponibles.
    """
    try:
        # Si la pestaña de Reseñas/Opiniones existe, NO es limitada.
        tabs = page.locator('button[role="tab"]').all_inner_texts()
        if any(re.search(r"reseñas|opiniones|reviews", t, re.IGNORECASE) for t in tabs):
            return False

        # Si no hay tab pero hay tarjetas de reseñas directas, tampoco es limitada
        if page.locator('div.jftiEf[data-review-id]').count() > 0:
            return False

        coincidencias = page.get_by_text(
            re.compile(r"vista limitada|limited view", re.IGNORECASE)
        )
        for i in range(min(coincidencias.count(), 5)):
            if coincidencias.nth(i).is_visible():
                return True
    except Exception:
        pass
    return False
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
        if es_vista_limitada(page):
            print(
                "[AVISO] Google Maps entregó la 'vista limitada': no incluye "
                "conteo ni reseñas. Probá SCRAPER_HEADLESS=False o "
                "SCRAPER_BROWSER_CHANNEL=chrome."
            )
            return reviews
        # 1. Abrir la pestaña de reseñas. Si esta variante de Maps no la tiene,
        #    las reseñas están en la vista general: se scrollea hasta cargarlas.
        if abrir_pestana_resenas(page):
            print("[Reseñas] Pestaña abierta.")
        else:
            try:
                print(
                    "[Reseñas] Pestañas visibles:",
                    page.locator('[role="tab"]').all_inner_texts(),
                )
            except Exception:
                pass
            print("[Reseñas] Sin pestaña de reseñas; se buscan en la vista general.")
            cargar_seccion_resenas(page)
            abrir_mas_resenas(page)
            if detectar_selector_resenas(page) is None:
                print("[Reseñas] No aparecieron tarjetas de reseñas.")
                volcar_debug_ficha(page, "sin_resenas")
                return reviews
        ordenado = ordenar_por_mas_bajas(page)
        # 2. Esperar a que carguen las tarjetas de reseñas
        selector_tarjetas = (
            detectar_selector_resenas(page, 6000)
            or 'div.jftiEf[data-review-id]'
        )
        print(f"[Reseñas] Selector de tarjetas: {selector_tarjetas}")
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
        fin_negativas = False
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
                        'span.kvMYJc[aria-label], '
                        '[role="img"][aria-label*="estrella" i], '
                        '[role="img"][aria-label*="star" i]'
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
                    # Ordenadas de menor a mayor: al llegar a 4-5★ ya no hay más negativas
                    if ordenado and estrellas >= 4:
                        fin_negativas = True
                        break
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
            if fin_negativas:
                print("[Reseñas] Ya no hay reseñas negativas (llegaron las 4-5★).")
                break
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
                        "(element) => element.scrollBy(0, 1500)"
                    )
                else:
                    scrollear_panel(page, 1500)
                page.wait_for_timeout(1000)
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
    max_tarjetas_negocios: int = 200,
    max_scrolls_negocios: int = 25,
    debug_interactivo: bool = False,
) -> list:
    """Busca negocios en Maps y devuelve leads con análisis o correo general."""
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
            # Maps cae a la 'vista limitada' si el navegador no tiene WebGL.
            # Estos flags habilitan WebGL por software en Chromium headless.
            browser = p.chromium.launch(
                headless=headless_mode,
                channel=os.getenv("SCRAPER_BROWSER_CHANNEL", "").strip() or None,
                args=[
                    "--use-angle=swiftshader",
                    "--enable-unsafe-swiftshader",
                    "--ignore-gpu-blocklist",
                    "--enable-webgl",
                ],
            )

        context = browser.new_context(
            locale="es-ES",
            viewport={"width": 1366, "height": 900},
        )
        page = context.new_page()
        page.set_default_timeout(8000)
        # Bloquear imágenes/fuentes acelera, pero puede cambiar lo que sirve Maps.
        # Desactivado por defecto; activar con SCRAPER_BLOCK_RESOURCES=true.
        if os.getenv("SCRAPER_BLOCK_RESOURCES", "false").lower() in (
            "true", "1", "yes"
        ):
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
                consentimiento = page.get_by_role(
                    "button",
                    name=re.compile(
                        r"Rechazar todo|Aceptar todo|Reject all|Accept all",
                        re.IGNORECASE,
                    ),
                )

                if consentimiento.count() > 0:
                    consentimiento.first.click(timeout=5000)
                    print("[Scraper] Consentimiento de Google gestionado.")
            except Exception as error:
                print(
                    f"[Scraper] No se pudo gestionar el consentimiento: "
                    f"{type(error).__name__}"
                )
            try:
                page.locator('div[role="feed"]').first.wait_for(timeout=20000)

            except PlaywrightTimeoutError as error:
                print("[Scraper] No se encontró el listado de negocios.")
                print(f"[Scraper] URL actual: {page.url}")
                print(f"[Scraper] Título: {page.title()}")

                raise RuntimeError(
                    "Google Maps no cargó el listado de negocios. "
                    "Revisar consentimiento, navegación o acceso desde Browserless."
                ) from error
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
                            if match_resenas else None
                        )
                        if clave in nombres_vistos:
                            print(f"[DUPLICADO] {nombre_preview}")
                            continue

                        # Descartar negocios fuera del rango sin abrir la ficha
                        if rating > 0 and not (rating_min <= rating <= rating_max):
                            print(
                                f"[FILTRO RAPIDO] {nombre_preview} | "
                                f"Rating: {rating} | Fuera de rango"
                            )
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
                        histograma = obtener_histograma_resenas(page)
                        if histograma:
                            total_h = sum(histograma.values())
                            if num_resenas_panel is None and total_h:
                                num_resenas_panel = total_h
                            bajas = sum(histograma.get(s, 0) for s in (1, 2, 3))
                            print(
                                f"[HISTOGRAMA] {histograma} | "
                                f"1-3★: {bajas / max(total_h, 1):.0%}"
                            )
                        # Normalizar a entero: si no hay dato, usamos 0
                        # (la BD tiene NOT NULL DEFAULT 0)
                        # Prioridad: panel > tarjeta del listado > 0
                        resenas_conocidas = (
                            num_resenas_panel is not None or num_resenas is not None
                        )
                        if num_resenas_panel is not None:
                            if (
                                num_resenas is not None
                                and num_resenas != int(num_resenas_panel)
                            ):
                                print(
                                    f"[AVISO] Conteo distinto: tarjeta={num_resenas} "
                                    f"| panel={num_resenas_panel}"
                                )
                            num_resenas = int(num_resenas_panel)
                        elif num_resenas is None:
                            num_resenas = 0
                        if rating_panel is not None:
                            rating = rating_panel
                        print(
                            f"[PANEL] {nombre} | "
                            f"Rating: {rating} | "
                            f"Reseñas: {num_resenas}"
                        )
                        # Aplicar filtros con los datos actualizados
                        # NOTA: el contador de reseñas a veces no aparece en el panel
                        # de Google Maps aun cuando el negocio tiene reseñas. Por eso
                        # ya no descartamos por "reseñas insuficientes" o "no disponibles".
                        # Si num_resenas es None o 0, igual guardamos el lead.
                        motivos = []
                        if not rating_min <= rating <= rating_max:
                            motivos.append(
                                f"rating fuera del rango {rating_min}-{rating_max}"
                            )
                        # Filtro de reseñas: solo aplica si el dato es conocido
                        if resenas_conocidas and num_resenas < resenas_min:
                            motivos.append(
                                f"reseñas insuficientes ({num_resenas} < {resenas_min})"
                            )
                        # (antes desactivado para la demo)
                        # si tenemos dato, lo registramos; si no, igual seguimos.
                        if num_resenas is not None and num_resenas > 0:
                            print(
                                f"[INFO] {nombre} | reseñas disponibles: {num_resenas}"
                            )
                        else:
                            print(
                                f"[INFO] {nombre} | sin dato de reseñas (igual se guarda)"
                            )
                        # Si hubo error de rating, seguimos filtrando solo eso
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
        max_tarjetas_negocios=200,
        max_scrolls_negocios=25,
        debug_interactivo=True,
    )
    print("\n--- OBJETO FINAL LISTO PARA FRONTEND / PERSISTENCIA ---")
    print(json.dumps(leads, indent=2, ensure_ascii=False))