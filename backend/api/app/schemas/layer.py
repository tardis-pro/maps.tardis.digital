from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.schemas.source import SourceSchema


class LayerBase(BaseModel):
    lid: str
    name: str
    attributes: dict = {}
    style: dict = {}


class LayerCreate(LayerBase):
    source_id: int


class LayerUpdate(BaseModel):
    lid: str | None = None
    name: str | None = None
    attributes: dict | None = None
    style: dict | None = None
    source_id: int | None = None


class LayerSchema(LayerBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source_id: int
    source: SourceSchema | None = None
    created_at: datetime
    updated_at: datetime | None = None
