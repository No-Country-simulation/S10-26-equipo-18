
import hashlib
import re
import unicodedata
import uuid

from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.models.lead import Lead
from app.models.scan import Resena, EscaneoLead


def normalizar(texto: str) -> str:
    """Normaliza nombres y ciudades para detectar duplicados."""
    texto = unicodedata.normalize("NFKD", texto or "")
    texto = "".join(
        caracter for caracter in texto
        if not unicodedata.combining(caracter)
    )
    return re.sub(r"\s+", " ", texto.casefold()).strip()


def clave_negocio(nombre: str, ciudad: str) -> str:
    return f"{normalizar(nombre)}|{normalizar(ciudad)}"


async def guardar_leads_escaneo(
    session,
    escaneo_id: str,
    leads: list[dict],
) -> dict:
    """
    Guarda o actualiza leads y reseñas de un escaneo existente.
    El commit lo realiza quien llama a esta función.
    """

    nuevos = 0
    actualizados = 0
    procesados = set()

    for dato in leads:
        nombre = dato["nombre"].strip()
        ciudad = dato["ciudad"].strip()
        fuente = dato.get("fuente") or "Google Maps"
        clave = clave_negocio(nombre, ciudad)

        # Evitar procesar dos veces el mismo negocio en un escaneo.
        identidad = (fuente, clave)
        if identidad in procesados:
            continue
        procesados.add(identidad)

        problema = dato.get("problema")
        analisis_valido = (
            problema in {
                "atencion", "precios", "higiene",
                "demoras", "calidad", "citas"
            }
            and int(dato.get("confianzaIA") or 0) > 0
        )

        draft = dato.get("draft") or {}
        ahora = datetime.now(timezone.utc)

        valores = {
            "id": str(uuid.uuid4()),
            "fuente": fuente,
            "clave_dedupe": clave,
            "nombre": nombre,
            "rubro": dato["rubro"],
            "ciudad": ciudad,
            "rating": Decimal(str(dato["rating"])),
            "num_resenas": int(dato["numResenas"]),
            "telefono": dato.get("telefono"),
            "web": dato.get("web"),
            "email": dato.get("email"),
            "linkedin": dato.get("linkedin"),
            "problema_ia": problema if analisis_valido else None,
            "confianza_ia": int(dato.get("confianzaIA") or 0),
            "origen_analisis": "gemini" if analisis_valido else "fallback",
            "estado_analisis": "completado" if analisis_valido else "fallido",
            "draft_asunto": draft.get("asunto"),
            "draft_cuerpo": draft.get("cuerpo"),
            "estado": "nuevo",
            "ultimo_escaneo": ahora,
        }

        # Primero intentamos insertar. Si ya existe, no duplicamos.
        stmt = (
            insert(Lead)
            .values(**valores)
            .on_conflict_do_nothing(
                index_elements=[Lead.fuente, Lead.clave_dedupe],
                index_where=Lead.clave_dedupe.is_not(None),
            )
            .returning(Lead.id)
        )

        resultado = await session.execute(stmt)
        nuevo_id = resultado.scalar_one_or_none()

        if nuevo_id:
            lead_id = nuevo_id
            nuevos += 1
        else:
            resultado = await session.execute(
                select(Lead).where(
                    Lead.fuente == fuente,
                    Lead.clave_dedupe == clave,
                )
            )
            lead = resultado.scalar_one()

            lead_id = lead.id
            actualizados += 1

            # Actualizamos información de reputación.
            lead.rating = valores["rating"]
            lead.num_resenas = valores["num_resenas"]
            lead.ultimo_escaneo = ahora

            if valores["telefono"]:
                lead.telefono = valores["telefono"]

            if valores["web"]:
                lead.web = valores["web"]

            if valores["email"]:
                lead.email = valores["email"]

            if valores["linkedin"]:
                lead.linkedin = valores["linkedin"]

            # No sobrescribir un análisis previo exitoso con fallback.
            if analisis_valido:
                lead.problema_ia = valores["problema_ia"]
                lead.confianza_ia = valores["confianza_ia"]
                lead.origen_analisis = "gemini"
                lead.estado_analisis = "completado"
                lead.draft_asunto = valores["draft_asunto"]
                lead.draft_cuerpo = valores["draft_cuerpo"]

            # No modificar lead.estado ni lead.vendedor_id.

        # Guardar reseñas negativas sin duplicar.
        for resena in dato.get("reviewsNegativas") or []:
            texto = (resena.get("texto") or "").strip()
            if not texto:
                continue

            huella = hashlib.sha256(
                normalizar(texto).encode("utf-8")
            ).hexdigest()

            fecha = None
            if resena.get("fecha"):
                fecha = date.fromisoformat(resena["fecha"])

            stmt_resena = (
                insert(Resena)
                .values(
                    lead_id=lead_id,
                    autor=resena.get("autor"),
                    fecha=fecha,
                    texto=texto,
                    estrellas=int(resena["estrellas"]),
                    huella_texto=huella,
                )
                .on_conflict_do_nothing(
                    index_elements=[
                        Resena.lead_id,
                        Resena.huella_texto,
                    ]
                )
            )

            await session.execute(stmt_resena)

        # Relacionar el negocio con el escaneo.
        stmt_relacion = (
            insert(EscaneoLead)
            .values(
                escaneo_id=escaneo_id,
                lead_id=lead_id,
                rating_observado=valores["rating"],
                num_resenas_observadas=valores["num_resenas"],
            )
            .on_conflict_do_nothing(
                index_elements=[
                    EscaneoLead.escaneo_id,
                    EscaneoLead.lead_id,
                ]
            )
        )

        await session.execute(stmt_relacion)

    return {
        "nuevos": nuevos,
        "actualizados": actualizados,
        "total": nuevos + actualizados,
    }
