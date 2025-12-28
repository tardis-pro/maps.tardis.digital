from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.schemas.layer import LayerSchema


class ProjectBase(BaseModel):
    pid: str
    name: str
    description: str | None = None
    project_type: str


class ProjectCreate(ProjectBase):
    layer_ids: list[int] = []


class ProjectUpdate(BaseModel):
    pid: str | None = None
    name: str | None = None
    description: str | None = None
    project_type: str | None = None
    layer_ids: list[int] | None = None


class ProjectSchema(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    layers: list[LayerSchema] = []
    created_at: datetime
    updated_at: datetime | None = None
