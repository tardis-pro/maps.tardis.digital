use pyo3::prelude::*;
use rayon::prelude::*;
use std::fs::File;
use std::io::{BufRead, BufReader};

#[pyclass]
#[derive(Debug, Clone)]
pub struct CsvPointBatch {
    #[pyo3(get)]
    pub points: Vec<(f64, f64, String)>,
}

#[pyfunction]
pub fn stream_csv_points(
    path: &str,
    lon_col: &str,
    lat_col: &str,
    chunk_size: usize,
) -> PyResult<Vec<CsvPointBatch>> {
    let file = File::open(path)
        .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;
    let reader = BufReader::new(file);
    let mut lines = reader.lines();

    let header = lines
        .next()
        .ok_or_else(|| PyErr::new::<pyo3::exceptions::PyValueError, _>("Empty CSV file"))?
        .map_err(|e| PyErr::new::<pyo3::exceptions::PyIOError, _>(e.to_string()))?;

    let columns: Vec<&str> = header.split(',').collect();
    let lon_idx = columns.iter().position(|&c| c.trim() == lon_col).ok_or_else(|| {
        PyErr::new::<pyo3::exceptions::PyValueError, _>(format!("Column '{}' not found", lon_col))
    })?;
    let lat_idx = columns.iter().position(|&c| c.trim() == lat_col).ok_or_else(|| {
        PyErr::new::<pyo3::exceptions::PyValueError, _>(format!("Column '{}' not found", lat_col))
    })?;

    let all_lines: Vec<String> = lines.filter_map(|l| l.ok()).collect();

    let records: Vec<(f64, f64, String)> = all_lines
        .par_iter()
        .filter_map(|line| {
            let fields: Vec<&str> = line.split(',').collect();
            if fields.len() <= lon_idx.max(lat_idx) {
                return None;
            }
            let lon: f64 = fields[lon_idx].trim().parse().ok()?;
            let lat: f64 = fields[lat_idx].trim().parse().ok()?;

            let mut props = serde_json::Map::new();
            for (i, col) in columns.iter().enumerate() {
                if i != lon_idx && i != lat_idx && i < fields.len() {
                    props.insert(
                        col.trim().to_string(),
                        serde_json::Value::String(fields[i].trim().to_string()),
                    );
                }
            }
            Some((lon, lat, serde_json::to_string(&props).unwrap_or_default()))
        })
        .collect();

    let batches: Vec<CsvPointBatch> = records
        .chunks(chunk_size)
        .map(|chunk| CsvPointBatch { points: chunk.to_vec() })
        .collect();

    Ok(batches)
}
