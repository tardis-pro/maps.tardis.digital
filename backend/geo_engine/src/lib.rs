use pyo3::prelude::*;

mod geometry;
mod import;

use geometry::{parse_geojson_file, parse_geojson_string, parser::ParsedFeature};
use import::{stream_csv_points, CsvPointBatch};

#[pyfunction]
fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[pymodule]
fn geo_engine(m: &Bound<'_, PyModule>) -> PyResult<()> {
    m.add_function(wrap_pyfunction!(version, m)?)?;
    m.add_function(wrap_pyfunction!(parse_geojson_file, m)?)?;
    m.add_function(wrap_pyfunction!(parse_geojson_string, m)?)?;
    m.add_function(wrap_pyfunction!(stream_csv_points, m)?)?;
    m.add_class::<ParsedFeature>()?;
    m.add_class::<CsvPointBatch>()?;
    Ok(())
}
