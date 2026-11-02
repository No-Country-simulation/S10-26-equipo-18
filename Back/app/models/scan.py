
from sqlalchemy import (
    Column,
    String,
    Integer,
    Numeric,
    Text,
    Date,
    DateTime,
    ForeignKey,
    BigInteger,
    Identity,
    CheckConstraint,
    UniqueConstraint,
    PrimaryKeyConstraint,
    ARRAY,
    func,
)

from app.models.lead import Base


class Resena(Base):
    __tablename__ = "resenas"

    id = Column(BigInteger, Identity(always=True), primary_key=True)
    lead_id = Column(
        String(100),
        ForeignKey("leads.id", ondelete="CASCADE"),
        nullable=False,
    )
    autor = Column(String(150))
    fecha = Column(Date)
    texto = Column(Text, nullable=False)
    estrellas = Column(Integer, nullable=False)
    huella_texto = Column(String(64), nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "lead_id",
            "huella_texto",
            name="uq_resenas_lead_huella",
        ),
    )


class Escaneo(Base):
    __tablename__ = "escaneos"

    id = Column(String(100), primary_key=True)

    usuario_id = Column(
        String(100),
        ForeignKey("usuarios.id", ondelete="SET NULL"),
    )

    ciudad = Column(String(100), nullable=False)
    rubro = Column(String(100), nullable=False)
    plataformas = Column(ARRAY(Text), nullable=False)

    rating_min = Column(Numeric(3, 2), nullable=False, default=1.5)
    rating_max = Column(Numeric(3, 2), nullable=False, default=3.5)
    resenas_min = Column(Integer, nullable=False, default=11)

    fecha = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    nuevos = Column(Integer, nullable=False, default=0)
    actualizados = Column(Integer, nullable=False, default=0)
    total = Column(Integer, nullable=False, default=0)

    estado = Column(
        String(20),
        nullable=False,
        default="en_progreso",
    )

    duracion_seg = Column(Integer)


class EscaneoLead(Base):
    __tablename__ = "escaneo_leads"

    escaneo_id = Column(
        String(100),
        ForeignKey("escaneos.id", ondelete="CASCADE"),
        nullable=False,
    )

    lead_id = Column(
        String(100),
        ForeignKey("leads.id", ondelete="CASCADE"),
        nullable=False,
    )

    rating_observado = Column(Numeric(3, 2))
    num_resenas_observadas = Column(Integer)

    detectado_en = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        PrimaryKeyConstraint("escaneo_id", "lead_id"),
    )
