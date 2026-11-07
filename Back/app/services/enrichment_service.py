import re
from playwright.sync_api import sync_playwright

def extraer_contacto_web(url_web: str) -> dict:
    """
    Visita el sitio web oficial del negocio para extraer mediante expresiones regulares (regex)
    el correo electrónico y perfiles de LinkedIn corporativos.
    """
    resultado = {
        "email": None,
        "linkedin": None
    }

    if not url_web or not url_web.startswith("http"):
        return resultado

    print(f"    [Enrichment] Analizando sitio web: {url_web}...")

    try:
        with sync_playwright() as p:
            # Lanzamos navegador en modo headless y seguro
            browser = p.chromium.launch(
                headless=True,
                args=["--disable-blink-features=AutomationControlled"]
            )
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                locale="es-ES"
            )
            page = context.new_page()

            # Bloquear imágenes, fuentes y estilos para acelerar drásticamente la carga
            page.route(
                "**/*",
                lambda route: route.abort()
                if route.request.resource_type in ["image", "media", "font", "stylesheet"]
                else route.continue_()
            )

            # Navegar a la web con un timeout prudente
            page.goto(url_web, timeout=15000, wait_until="domcontentloaded")
            
            # Obtener el contenido HTML completo de la página
            html_content = page.content()

            # 1. Extracción de Email mediante Regex avanzada
            # Busca patrones estándar de correo electrónico
            emailsEncontrados = re.findall(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", html_content)
            
            # Filtrar posibles falsos positivos (extensiones de archivos de imagen o código)
            extensionesInvalidas = ('.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.css', '.js')
            emailsValidos = [
                correo.lower() for correo in emailsEncontrados 
                if not correo.endswith(extensionesInvalidas)
            ]

            if emailsValidos:
                # Tomamos el primer email corporativo válido que aparezca
                resultado["email"] = emailsValidos[0]
                print(f"    [Enrichment] ¡Email detectado!: {resultado['email']}")

            # 2. Extracción de perfil o página de LinkedIn mediante Regex
            matchLinkedin = re.search(r"https?:\/\/(?:www\.)?linkedin\.com\/(?:in|company)\/[a-zA-Z0-9_-]+", html_content)
            if matchLinkedin:
                resultado["linkedin"] = matchLinkedin.group(0)
                print(f"    [Enrichment] ¡LinkedIn detectado!: {resultado['linkedin']}")

            browser.close()

    except Exception as error:
        print(f"    [Enrichment] No se pudo extraer información de contacto de {url_web}: {error}")

    return resultado