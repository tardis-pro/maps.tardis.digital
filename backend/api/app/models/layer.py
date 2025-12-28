from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, JSON, ForeignKey, DateTime, func, Table, Column, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.source import Source
    from app.models.project import Project

layer_project = Table(
    "core_layer_projects",
    Base.metadata,
    Column("layer_id", Integer, ForeignKey("core_layer.id"), primary_key=True),
    Column("project_id", Integer, ForeignKey("core_project.id"), primary_key=True),
)


class Layer(Base):
    __tablename__ = "core_layer"

    id: Mapped[int] = mapped_column(primary_key=True)
    lid: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("core_source.id"))
    attributes: Mapped[dict] = mapped_column(JSON, default=dict)
    style: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), onupdate=func.now(), nullable=True
    )

    source: Mapped["Source"] = relationship(back_populates="layers")
    projects: Mapped[list["Project"]] = relationship(
        secondary=layer_project, back_populates="layers"
    )
