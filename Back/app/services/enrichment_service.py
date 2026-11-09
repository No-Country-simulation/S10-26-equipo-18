import re
import httpx
from bs4 import BeautifulSoup

def extraer_contacto_web(url_web: str) -> dict:
    """
    Visita el sitio web oficial del negocio mediante httpx y BeautifulSoup
    para extraer de forma ligera y segura el correo electrónico y perfiles de LinkedIn.
    """
    resultado = {
        "email": None,
        "linkedin": None
    }

    if not url_web or not url_web.startswith("http"):
        return resultado

    print(f"    [Enrichment] Analizando sitio web con httpx: {url_web}...")

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "es-ES,es;q=0.9"
    }

    try:
        # Petición HTTP rápida y segura con un timeout prudente de 8 segundos
        with httpx.Client(headers=headers, follow_redirects=True, timeout=8.0) as client:
            response = client.get(url_web)
            
            # Si la web responde correctamente, procesamos el HTML
            if response.status_code == 200:
                html_content = response.text
                soup = BeautifulSoup(html_content, "html.parser")
                
                # Opcional: limpiar scripts y estilos para que la búsqueda sea más limpia
                for script_or_style in soup(["script", "style"]):
                    script_or_style.decompose()
                
                texto_limpio = soup.get_text()

                # 1. Extracción de Email mediante Regex avanzada
                emails_encontrados = re.findall(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", texto_limpio)
                
                # Filtrar falsos positivos (extensiones de imágenes, archivos o código)
                extensiones_invalidas = ('.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.css', '.js', '.ico')
                emails_validos = [
                    correo.lower() for correo in emails_encontrados 
                    if not correo.endswith(extensiones_invalidas) and not any(ext in correo for ext in ['.png?', '.jpg?'])
                ]

                if emails_validos:
                    resultado["email"] = emails_validos[0]
                    print(f"    [Enrichment] ¡Email detectado via httpx!: {resultado['email']}")

                # 2. Extracción de perfil o página de LinkedIn mediante Regex
                match_linkedin = re.search(r"https?:\/\/(?:www\.)?linkedin\.com\/(?:in|company)\/[a-zA-Z0-9_-]+", html_content)
                if match_linkedin:
                    resultado["linkedin"] = match_linkedin.group(0)
                    print(f"    [Enrichment] ¡LinkedIn detectado via httpx!: {resultado['linkedin']}")
            else:
                print(f"    [Enrichment] La web respondió con estado HTTP {response.status_code}")

    except httpx.TimeoutException:
        print(f"    [Enrichment] Timeout al intentar conectar con {url_web}")
    except httpx.RequestError as req_err:
        print(f"    [Enrichment] Error de conexión con {url_web}: {req_err}")
    except Exception as error:
        print(f"    [Enrichment] Error inesperado procesando {url_web}: {error}")

    return resultado