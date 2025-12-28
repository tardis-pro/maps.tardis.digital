use geojson::{Feature, GeoJson};
use pyo3::prelude::*;
use std::fs;

#[pyclass]
#[derive(Debug, Clone)]
pub struct ParsedFeature {
    #[pyo3(get)]
    pub geometry: String,
    #[pyo3(get)]
    pub properties: String,
    #[pyo3(get)]
    pub geom_type: String,
}

#[pyfunction]
pub fn parse_geojson_file(path: &str) -> PyResult<Vec<ParsedFeature>> {
    let content = fs::read_to_string(path)
        .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;
    parse_geojson_string(&content)
}

#[pyfunction]
pub fn parse_geojson_string(content: &str) -> PyResult<Vec<ParsedFeature>> {
    let geojson: GeoJson = content
        .parse()
        .map_err(|e: geojson::Error| PyErr::new::<pyo3::exceptions::PyValueError, _>(e.to_string()))?;

    let features = match geojson {
        GeoJson::FeatureCollection(fc) => fc.features,
        GeoJson::Feature(f) => vec![f],
        GeoJson::Geometry(g) => vec![Feature {
            geometry: Some(g),
            properties: None,
            id: None,
            bbox: None,
            foreign_members: None,
        }],
    };

    let mut parsed = Vec::with_capacity(features.len());

    for feature in features {
        if let Some(geom) = feature.geometry {
            let geom_type = match &geom.value {
                geojson::Value::Point(_) => "Point",
                geojson::Value::MultiPoint(_) => "MultiPoint",
                geojson::Value::LineString(_) => "LineString",
                geojson::Value::MultiLineString(_) => "MultiLineString",
                geojson::Value::Polygon(_) => "Polygon",
                geojson::Value::MultiPolygon(_) => "MultiPolygon",
                geojson::Value::GeometryCollection(_) => "GeometryCollection",
            };

            let props = feature
                .properties
                .map(|p| serde_json::to_string(&p).unwrap_or_default())
                .unwrap_or_else(|| "{}".to_string());

            parsed.push(ParsedFeature {
                geometry: geom.to_string(),
                properties: props,
                geom_type: geom_type.to_string(),
            });
        }
    }

    Ok(parsed)
}
