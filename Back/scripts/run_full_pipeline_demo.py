import os
import sys
import json
import re
from pathlib import Path
from dotenv import load_dotenv

backend_dir = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_dir))
load_dotenv(backend_dir.parent / ".env")

from app.services.ai_service import analizar_con_ia

quejas_reales_extraidas = [
    {
        "autor": "Cliente Maps",
        "estrellas": 1,
        "texto": "Había venido 1 vez anteriormente y estuvo rico, por eso hoy volví, pero no me gustó la atención, los platos tardaron más de 45 minutos y la comida llegó fría a la mesa."
    },
    {
        "autor": "Cliente Maps 2",
        "estrellas": 1,
        "texto": "Para empezar había realizado mi reserva con confirmación y llegué allá y me dijeron que no la tenían registrada. El personal de recepción fue muy poco empático y nos tocó esperar de pie."
    }
]

print("Enviando quejas reales a Gemini (gemini-3.5-flash)...")
resultado_ia = analizar_con_ia(
    nombre="Restaurante El Gato Gris",
    rubro="restaurantes",
    ciudad="Bogotá",
    reviews=quejas_reales_extraidas
)

lead_completo = {
    "id": "lead-bog-gatogris-01",
    "nombre": "Restaurante El Gato Gris",
    "rubro": "restaurante",
    "ciudad": "Bogotá",
    "fuente": "Google Maps",
    "rating": 4.2,
    "numResenas": 1250,
    "telefono": "+57 310 2345678",
    "web": "https://elgatogris.com.co",
    "email": "contacto@elgatogris.com.co",
    "linkedin": None,
    "problema": resultado_ia.get("problema"),
    "confianzaIA": resultado_ia.get("confianzaIA"),
    "reviewsNegativas": quejas_reales_extraidas,
    "draft": resultado_ia.get("draft"),
    "estado": "nuevo",
    "actualizado": False,
    "ultimoEscaneo": "2026-11-13",
    "vendedor": None
}

output_path = backend_dir / "scripts" / "leads_demo_extraidos.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump([lead_completo], f, indent=2, ensure_ascii=False)

print("\n" + "="*60)
print(f"PIPELINE COMPLETO Y PERSISTIDO EN: {output_path}")
print("="*60)
print(json.dumps(lead_completo, indent=2, ensure_ascii=False))
