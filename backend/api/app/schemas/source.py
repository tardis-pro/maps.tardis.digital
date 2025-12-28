from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SourceBase(BaseModel):
    sid: str
    name: str
    description: str | None = None
    source_type: str
    attributes: dict = {}


class SourceCreate(SourceBase):
    pass


class SourceUpdate(BaseModel):
    sid: str | None = None
    name: str | None = None
    description: str | None = None
    source_type: str | None = None
    attributes: dict | None = None


class SourceSchema(SourceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime | None = None
