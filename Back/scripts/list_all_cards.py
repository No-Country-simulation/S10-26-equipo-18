import os
import re
from playwright.sync_api import sync_playwright

os.environ["PLAYWRIGHT_BROWSERS_PATH"] = r"D:\playwright_browsers"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(locale="es-ES")
    
    url = "https://www.google.com/maps/search/cl%C3%ADnica+odontol%C3%B3gica+en+Bogot%C3%A1?hl=es"
    page.goto(url, wait_until="domcontentloaded", timeout=30000)
    page.wait_for_timeout(3000)
    
    try:
        btn_cookie = page.get_by_role("button", name=re.compile(r"Rechazar|Aceptar", re.I)).first
        if btn_cookie.is_visible():
            btn_cookie.click()
            page.wait_for_timeout(1000)
    except Exception:
        pass
        
    page.locator('div[role="feed"]').first.wait_for(timeout=15000)
    
    # Evaluar todas las tarjetas para ver cuántas reseñas tienen
    tarjetas = page.locator('div[role="feed"] div[role="article"]')
    print(f"Tarjetas: {tarjetas.count()}")
    for i in range(tarjetas.count()):
        txt = tarjetas.nth(i).inner_text().replace("\n", " | ")
        print(f"[{i}] {txt[:100]}")
        
    browser.close()
