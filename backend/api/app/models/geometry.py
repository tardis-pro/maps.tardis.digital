from typing import TYPE_CHECKING

from geoalchemy2 import Geometry as GeoAlchemyGeometry
from sqlalchemy import String, JSON, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.source import Source


class Geometry(Base):
    __tablename__ = "core_geometry"

    gid: Mapped[int] = mapped_column(primary_key=True)
    geom: Mapped[str] = mapped_column(
        GeoAlchemyGeometry(srid=4326, spatial_index=True)
    )
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, default=dict)
    geometry_type: Mapped[str] = mapped_column(String(50), index=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("core_source.id"))

    source: Mapped["Source"] = relationship(back_populates="geometries")

    __table_args__ = (
        UniqueConstraint("gid", "source_id", name="unique_gid_source"),
    )
