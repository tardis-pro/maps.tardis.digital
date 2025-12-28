from pydantic import BaseModel, ConfigDict


class GeometryBase(BaseModel):
    geometry_type: str
    metadata_: dict = {}


class GeometryCreate(GeometryBase):
    geom: dict
    source_id: int


class GeometrySchema(GeometryBase):
    model_config = ConfigDict(from_attributes=True)

    gid: int
    source_id: int
