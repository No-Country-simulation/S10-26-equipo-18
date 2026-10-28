from sqlalchemy import Column, String, Integer, Numeric, Text, DateTime, ForeignKey
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class Lead(Base):
    __tablename__ = "leads"

    id = Column(String(100), primary_key=True)
    fuente_id = Column(String(255))
    clave_dedupe = Column(String(300))
    nombre = Column(String(255), nullable=False)
    rubro = Column(String(100), nullable=False)
    ciudad = Column(String(100), nullable=False)
    fuente = Column(String(100), nullable=False)
    rating = Column(Numeric(3, 2), nullable=False)
    num_resenas = Column(Integer, nullable=False)
    telefono = Column(String(50))
    web = Column(Text)
    email = Column(String(255))
    linkedin = Column(Text)

    problema_ia = Column(String(30))
    confianza_ia = Column(Integer)
    origen_analisis = Column(String(20))
    estado_analisis = Column(String(20))
    draft_asunto = Column(Text)
    draft_cuerpo = Column(Text)

    estado = Column(String(20))
    vendedor_id = Column(String(100), ForeignKey("usuarios.id"))
    creado_en = Column(DateTime(timezone=True))
    ultimo_escaneo = Column(DateTime(timezone=True))